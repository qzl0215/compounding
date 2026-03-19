const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");
const { recordReleaseHandoff } = require("../coord/lib/companion-lifecycle.ts");
const {
  changeSummary,
  currentActiveRelease,
  ensureLayout,
  git,
  parseTaskIdList,
  pendingDevRelease,
  previewBaseUrl,
    productionBaseUrl,
    readTaskDeliveryMetadata,
    releaseIdFor,
    resolveCanonicalTaskIds,
    resolveCommit,
    setPendingDevRelease,
    updateChannelSymlink,
  upsertRelease,
  withReleaseLock,
} = require("./lib.ts");

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

function runNodeScript(scriptPath) {
  return JSON.parse(
    childProcess.execFileSync("node", ["--experimental-strip-types", scriptPath], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
  );
}

function ensurePreviewAvailable(releaseId, releasePath) {
  updateChannelSymlink(releasePath, "dev");
  const startScript = path.join(process.cwd(), "scripts", "local-runtime", "start-preview.ts");
  const payload = runNodeScript(startScript);
  return {
    ok: Boolean(payload.ok),
    message: payload.message || `dev 预览 ${releaseId} 已生成。`,
    note: payload.message || "",
  };
}

function main() {
  if (!["dev", "prod"].includes(channel)) {
    console.log(JSON.stringify({ ok: false, message: `Unsupported channel: ${channel}` }));
    process.exit(1);
  }

  const layout = ensureLayout();
  let record;
  let message = "";
  let ok = false;

  try {
    const result = withReleaseLock(() => {
      if (channel === "dev") {
        const existingPending = pendingDevRelease();
        if (existingPending) {
          return {
            ok: false,
            message: "当前已有未验收的 dev 预览，请先验收上一个 dev。",
            release: existingPending,
          };
        }
        if (!primaryTaskId) {
          return {
            ok: false,
            message: "生成 dev 预览前必须指定主 task。",
          };
        }
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

      git(["worktree", "add", "--detach", releasePath, commitSha]);
      try {
        git(["clean", "-fdx"], releasePath);
        childProcess.execFileSync("pnpm", ["install", "--frozen-lockfile=false"], {
          cwd: releasePath,
          stdio: ["ignore", "pipe", "pipe"],
        });
        childProcess.execFileSync("pnpm", ["build"], {
          cwd: releasePath,
          stdio: ["ignore", "pipe", "pipe"],
        });

        const buildIdPath = path.join(releasePath, "apps", "studio", ".next", "BUILD_ID");
        const smokePassed = fs.existsSync(buildIdPath);
        if (!smokePassed) {
          notes.push("BUILD_ID missing after build.");
        }

        const prepared = {
          release_id: releaseId,
          commit_sha: commitSha,
          tag: null,
          source_ref: ref,
          primary_task_id: taskMeta?.id || null,
          linked_task_ids: normalizedLinkedTaskIds,
          delivery_summary: taskMeta?.delivery_summary || null,
          delivery_benefit: taskMeta?.delivery_benefit || null,
          delivery_risks: taskMeta?.delivery_risks || null,
          channel,
          acceptance_status: channel === "dev" ? "pending" : "accepted",
          preview_url: channel === "dev" ? previewBaseUrl() : null,
          promoted_to_main_at: null,
          promoted_from_dev_release_id: null,
          created_at: new Date().toISOString(),
          status: channel === "dev" ? "preview" : "prepared",
          build_result: "passed",
          smoke_result: smokePassed ? "passed" : "failed",
          cutover_at: null,
          rollback_from: null,
          release_path: releasePath,
          change_summary: summary,
          notes,
        };

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
            delivery_summary: prepared.delivery_summary,
            delivery_benefit: prepared.delivery_benefit,
            delivery_risks: prepared.delivery_risks,
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
        const failed = {
          release_id: releaseId,
          commit_sha,
          tag: null,
          source_ref: ref,
          primary_task_id: taskMeta?.id || null,
          linked_task_ids: normalizedLinkedTaskIds,
          delivery_summary: null,
          delivery_benefit: null,
          delivery_risks: null,
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
          release_path: releasePath,
          change_summary: summary,
          notes: [error instanceof Error ? error.message : "release build failed"],
        };
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
      delivery_summary: null,
      delivery_benefit: null,
      delivery_risks: null,
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

  console.log(
    JSON.stringify({
      ok,
      message,
      release: record,
      links: {
        dev: previewBaseUrl(),
        production: productionBaseUrl(),
      },
      registry: require("./lib.ts").readRegistry(),
    })
  );
}

main();
