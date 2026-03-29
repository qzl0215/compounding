const path = require("node:path");
const { recordReleaseHandoff } = require("../coord/lib/companion-lifecycle.ts");
const { finishActiveStage, recordBlocker, startActiveStage, startWaitStage } = require("../coord/lib/task-activity.ts");
const { refreshLearningCandidatesSnapshot } = require("../ai/lib/learning-candidates.ts");
const {
  changeSummary,
  currentActiveRelease,
  ensureLayout,
  materializeReleaseWorkspace,
  parseTaskIdList,
  pendingDevRelease,
  previewBaseUrl,
  productionBaseUrl,
  repairRegistry,
  readTaskDeliveryMetadata,
  releaseIdFor,
  resolveCanonicalTaskIds,
  resolveCommit,
  setPendingDevRelease,
  updateChannelSymlink,
  upsertRelease,
  withReleaseLock,
} = require("./lib.ts");
const {
  createReleaseRecord,
  ensurePreviewAvailable,
  hasBuildSmokeSignal,
  installAndBuildRelease,
} = require("./prepare-release-support.ts");

function parseArg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  return process.argv[index + 1] || fallback;
}

const ref = parseArg("--ref", "HEAD");
const channel = parseArg("--channel", "prod");
const primaryTaskId = parseArg("--primary-task", null);
const linkedTaskIds = parseTaskIdList(parseArg("--linked-tasks", ""));

function canPrepareChannel(channelName, taskId) {
  if (channelName !== "dev") {
    return null;
  }
  const existingPending = pendingDevRelease(repairRegistry());
  if (existingPending) {
    return {
      ok: false,
      message: "当前已有未验收的 dev 预览，请先验收上一个 dev。",
      release: existingPending,
    };
  }
  if (!taskId) {
    return {
      ok: false,
      message: "生成 dev 预览前必须指定主 task。",
    };
  }
  return null;
}

function main() {
  if (!["dev", "prod"].includes(channel)) {
    console.log(JSON.stringify({ ok: false, message: `Unsupported channel: ${channel}` }));
    process.exit(1);
  }

  if (primaryTaskId) {
    startActiveStage(primaryTaskId, "release_prepare", {
      source: "release:prepare",
      status: "running",
      reason: `开始准备 ${channel} release。`,
    });
  }

  const layout = ensureLayout();
  let record;
  let message = "";
  let ok = false;

  try {
    const result = withReleaseLock(() => {
      const blocked = canPrepareChannel(channel, primaryTaskId);
      if (blocked) {
        return blocked;
      }

      const commitSha = resolveCommit(ref);
      const releaseId = releaseIdFor(commitSha, channel);
      const releasePath = path.join(layout.releasesDir, releaseId);
      const current = currentActiveRelease();
      const summary = changeSummary(current?.commit_sha || null, commitSha);
      const notes = [];
      const taskMeta = primaryTaskId ? readTaskDeliveryMetadata(primaryTaskId) : null;
      const normalizedLinkedTaskIds = resolveCanonicalTaskIds(linkedTaskIds)
        .filter((taskId) => taskId !== taskMeta?.id)
        .slice(0, 2);

      materializeReleaseWorkspace(releasePath, releaseId, commitSha);
      try {
        installAndBuildRelease(releasePath);
        const smokePassed = hasBuildSmokeSignal(releasePath);
        if (!smokePassed) {
          notes.push("BUILD_ID missing after build.");
        }

        const prepared = createReleaseRecord({
          releaseId,
          commitSha,
          ref,
          channel,
          taskMeta,
          linkedTaskIds: normalizedLinkedTaskIds,
          releasePath,
          summary,
          createdAt: new Date().toISOString(),
          status: channel === "dev" ? "preview" : "prepared",
          buildResult: "passed",
          smokeResult: smokePassed ? "passed" : "failed",
          notes,
        });

        upsertRelease(prepared);
        if (taskMeta?.id) {
          recordReleaseHandoff(taskMeta.id, {
            source: "release:prepare",
            channel,
            release_id: releaseId,
            acceptance_status: prepared.acceptance_status,
            release_path: releasePath,
            commit_sha: commitSha,
            preview_url: prepared.preview_url,
            linked_task_ids: normalizedLinkedTaskIds,
            change_summary: summary,
            status: prepared.status,
          });
        }
        if (!smokePassed) {
          return { ok: false, message: `Release ${releaseId} failed before cutover.`, release: prepared };
        }

        if (channel === "dev") {
          setPendingDevRelease(releaseId);
          const preview = ensurePreviewAvailable(releaseId, releasePath);
          const release = { ...prepared, notes: [...prepared.notes, preview.note].filter(Boolean) };
          upsertRelease(release);
          return {
            ok: preview.ok,
            message: preview.ok ? `dev 预览 ${releaseId} 已就绪：${previewBaseUrl()}` : preview.message,
            release,
          };
        }

        return {
          ok: true,
          message: `Release ${releaseId} is prepared and ready for cutover.`,
          release: prepared,
        };
      } catch (error) {
        const failed = createReleaseRecord({
          releaseId,
          commitSha,
          ref,
          channel,
          taskMeta,
          linkedTaskIds: normalizedLinkedTaskIds,
          releasePath,
          summary,
          createdAt: new Date().toISOString(),
          status: "failed",
          buildResult: "failed",
          smokeResult: "failed",
          notes: [error instanceof Error ? error.message : "release build failed"],
        });
        upsertRelease(failed);
        return {
          ok: false,
          message: `Release ${releaseId} failed before cutover.`,
          release: failed,
        };
      }
    });

    record = result.release;
    message = result.message;
    ok = Boolean(result.ok);
  } catch (error) {
    record = {
      release_id: "unresolved",
      commit_sha: "unresolved",
      tag: null,
      source_ref: ref,
      primary_task_id: primaryTaskId || null,
      linked_task_ids: linkedTaskIds.filter((taskId) => taskId !== primaryTaskId).slice(0, 2),
      delivery_snapshot: null,
      channel,
      acceptance_status: channel === "dev" ? "rejected" : "accepted",
      preview_url: channel === "dev" ? previewBaseUrl() : null,
      promoted_to_main_at: null,
      promoted_from_dev_release_id: null,
      created_at: new Date().toISOString(),
      status: "failed",
      build_result: "failed",
      smoke_result: "failed",
      cutover_at: null,
      rollback_from: null,
      release_path: "",
      change_summary: [],
      notes: [error instanceof Error ? error.message : "failed to prepare release"],
    };
    message = channel === "dev" ? "dev 预览准备失败。" : "Release prepare failed.";
  }

  if (primaryTaskId) {
    if (!ok) {
      recordBlocker(primaryTaskId, "release_prepare", {
        source: "release:prepare",
        status: "blocked",
        reason: message,
        relatedDocs: ["docs/DEV_WORKFLOW.md"],
      });
    }
    finishActiveStage(primaryTaskId, "release_prepare", {
      source: "release:prepare",
      status: ok ? "prepared" : "blocked",
      reason: message,
    });
    if (ok && channel === "dev") {
      startWaitStage(primaryTaskId, "acceptance_wait", {
        source: "release:prepare",
        status: "pending",
        reason: "dev 预览已生成，等待验收。",
      });
    }
  }

  const learningSnapshot = refreshLearningCandidatesSnapshot(process.cwd(), {
    taskId: primaryTaskId || null,
  });

  console.log(
    JSON.stringify({
      ok,
      message,
      release: record,
      links: {
        dev: previewBaseUrl(),
        production: productionBaseUrl(),
      },
      learning_candidates_path: learningSnapshot.json_path || null,
      registry: require("./lib.ts").readRegistry(),
    })
  );
}

main();
