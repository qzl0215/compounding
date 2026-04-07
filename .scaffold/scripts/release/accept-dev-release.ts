const childProcess = require("node:child_process");
const { recordReleaseCleanupSchedule, recordReleaseHandoff } = require("../coord/lib/companion-lifecycle.ts");
const { applyTaskTransition } = require("../coord/lib/task-machine.ts");
const { finishWaitStageIfOpen, recordBlocker } = require("../coord/lib/task-activity.ts");
const { refreshLearningCandidatesSnapshot } = require("../ai/lib/learning-candidates.ts");
const {
  clearChannelSymlink,
  clearPendingDevRelease,
  detachReleaseWorktrees,
  ensureReleaseTag,
  materializeProdRuntime,
  markActive,
  pendingDevRelease,
  previewBaseUrl,
  pruneInactiveProdRuntimeCopies,
  productionBaseUrl,
  repairRegistry,
  readManifest,
  readRegistry,
  releaseReload,
  run,
  updateChannelSymlink,
  upsertRelease,
  withReleaseLock,
} = require("./lib.ts");
const { stabilizeLocalProdRuntime } = require("./prod-runtime-stability.ts");
const { transitionReleaseRecord } = require("../../shared/release-state-machine.ts");

function parseArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return null;
  }
  return process.argv[index + 1] || null;
}

function runGit(args) {
  return childProcess.execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

const releaseId = parseArg("--release");
let activityTaskId = null;

try {
  const result = withReleaseLock(() => {
    const pending = releaseId ? readManifest(releaseId) : pendingDevRelease(repairRegistry());
    if (!pending || pending.channel !== "dev" || pending.acceptance_status !== "pending") {
      throw new Error("当前没有可验收的 pending dev 预览。");
    }
    activityTaskId = pending.primary_task_id || null;

    const originalBranch = runGit(["branch", "--show-current"]);
    runGit(["checkout", "main"]);
    try {
      runGit(["merge", "--ff-only", pending.commit_sha]);
    } catch (error) {
      if (originalBranch && originalBranch !== "main") {
        runGit(["checkout", originalBranch]);
      }
      throw error;
    }

    const promotedAt = new Date().toISOString();
    const tag = ensureReleaseTag(`release-${pending.release_id}`, pending.commit_sha);
    const promotedRecord = transitionReleaseRecord(
      {
        ...pending,
        notes: [...pending.notes, `Accepted from dev preview ${pending.release_id}`],
      },
      "promote_release",
      {
        channel: "prod",
        recorded_at: promotedAt,
        source: "release:accept-dev",
      }
    );
    const prodRuntimePath = materializeProdRuntime(pending.release_path, pending.release_id, pending.commit_sha);
    updateChannelSymlink(prodRuntimePath, "prod");
    markActive(pending.release_id);
    const reloadNote = releaseReload();
    const stabilityNote = stabilizeLocalProdRuntime(process.cwd(), run, pending.release_id);
    const activeRecord = readRegistry().releases.find((item) => item.release_id === pending.release_id) || promotedRecord;
    upsertRelease({
      ...activeRecord,
      ...promotedRecord,
      tag: activeRecord.tag || tag,
      source_ref: "main",
      channel: "prod",
      preview_url: null,
      promoted_to_main_at: promotedAt,
      promoted_from_dev_release_id: null,
      created_at: activeRecord.created_at || promotedAt,
      cutover_at: promotedAt,
      rollback_from: null,
      notes: [...promotedRecord.notes, reloadNote, stabilityNote].filter(Boolean),
    });
    pruneInactiveProdRuntimeCopies(pending.release_id);
    clearPendingDevRelease();
    clearChannelSymlink("dev");
    if (pending.primary_task_id) {
      recordReleaseHandoff(pending.primary_task_id, {
        source: "release:accept-dev",
        channel: "prod",
        release_id: pending.release_id,
        acceptance_status: "accepted",
        release_path: pending.release_path,
        commit_sha: pending.commit_sha,
        production_url: productionBaseUrl(),
        promoted_from_dev_release_id: null,
        linked_task_ids: pending.linked_task_ids,
        change_summary: pending.change_summary,
        status: "active",
      });
      recordReleaseCleanupSchedule(pending.primary_task_id, {
        trigger: "prod_accepted",
        eligible_at: promotedAt,
        scheduled_for: new Date(Date.parse(promotedAt) + 24 * 60 * 60 * 1000).toISOString(),
        delay_hours: 24,
        release_id: pending.release_id,
        commit_sha: pending.commit_sha,
        linked_task_ids: pending.linked_task_ids,
        recorded_at: promotedAt,
      });
    }
    const stopPreviewScript = require("node:path").join(process.cwd(), "scripts", "local-runtime", "stop-preview.ts");
    try {
      childProcess.execFileSync("node", ["--experimental-strip-types", stopPreviewScript], {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch {}
    detachReleaseWorktrees([pending.release_path]);

    return {
      release: readRegistry().releases.find((item) => item.release_id === pending.release_id),
      registry: readRegistry(),
    };
  });

  console.log(
    JSON.stringify({
      ok: true,
      message: "dev 预览已验收，并已发布到 main 与本地生产。",
      release: result.release,
      links: {
        dev: previewBaseUrl(),
        production: productionBaseUrl(),
      },
      learning_candidates_path: refreshLearningCandidatesSnapshot(process.cwd(), { taskId: activityTaskId }).json_path || null,
      registry: result.registry,
    })
  );
  if (activityTaskId) {
    applyTaskTransition(activityTaskId, "acceptance_accepted", {
      source: "release:accept-dev",
    });
    finishWaitStageIfOpen(activityTaskId, "acceptance_wait", {
      source: "release:accept-dev",
      status: "accepted",
      reason: "dev 预览已验收并晋升到 main。",
    });
  }
} catch (error) {
  if (activityTaskId) {
    recordBlocker(activityTaskId, "acceptance_wait", {
      source: "release:accept-dev",
      status: "failed",
      reason: error instanceof Error ? error.message : "Failed to accept dev release.",
      relatedDocs: ["docs/DEV_WORKFLOW.md"],
    });
  }
  console.log(
    JSON.stringify({
      ok: false,
      message: error instanceof Error ? error.message : "Failed to accept dev release.",
      links: {
        dev: previewBaseUrl(),
        production: productionBaseUrl(),
      },
      learning_candidates_path: refreshLearningCandidatesSnapshot(process.cwd(), { taskId: activityTaskId }).json_path || null,
    })
  );
}
