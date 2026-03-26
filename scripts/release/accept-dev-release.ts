const childProcess = require("node:child_process");
const { recordReleaseHandoff } = require("../coord/lib/companion-lifecycle.ts");
const { finishWaitStageIfOpen, recordBlocker } = require("../coord/lib/task-activity.ts");
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
  releaseIdFor,
  releaseReload,
  run,
  updateChannelSymlink,
  upsertRelease,
  withReleaseLock,
} = require("./lib.ts");
const { stabilizeLocalProdRuntime } = require("./prod-runtime-stability.ts");

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
    const prodReleaseId = releaseIdFor(pending.commit_sha, "prod");
    const prodTag = ensureReleaseTag(`release-${prodReleaseId}`, pending.commit_sha);
    const prodRecord = {
      ...pending,
      release_id: prodReleaseId,
      tag: prodTag,
      source_ref: "main",
      channel: "prod",
      acceptance_status: "accepted",
      preview_url: null,
      promoted_to_main_at: null,
      promoted_from_dev_release_id: pending.release_id,
      created_at: promotedAt,
      status: "prepared",
      cutover_at: null,
      rollback_from: null,
      notes: [...pending.notes, `Accepted from dev preview ${pending.release_id}`],
    };

    upsertRelease(prodRecord);
    const prodRuntimePath = materializeProdRuntime(pending.release_path, prodReleaseId, pending.commit_sha);
    updateChannelSymlink(prodRuntimePath, "prod");
    markActive(prodReleaseId);
    const reloadNote = releaseReload();
    const stabilityNote = stabilizeLocalProdRuntime(process.cwd(), run, prodReleaseId);
    const activeRecord = readRegistry().releases.find((item) => item.release_id === prodReleaseId) || prodRecord;
    upsertRelease({ ...activeRecord, notes: [...activeRecord.notes, reloadNote, stabilityNote].filter(Boolean) });
    pruneInactiveProdRuntimeCopies(prodReleaseId);

    const acceptedDevRecord = {
      ...pending,
      status: "preview",
      acceptance_status: "accepted",
      promoted_to_main_at: promotedAt,
      notes: [...pending.notes, `Accepted and promoted to main as ${prodReleaseId}`],
    };
    upsertRelease(acceptedDevRecord);
    clearPendingDevRelease();
    clearChannelSymlink("dev");
    if (pending.primary_task_id) {
      recordReleaseHandoff(pending.primary_task_id, {
        source: "release:accept-dev",
        channel: "prod",
        release_id: prodReleaseId,
        acceptance_status: "accepted",
        release_path: pending.release_path,
        commit_sha: pending.commit_sha,
        production_url: productionBaseUrl(),
        promoted_from_dev_release_id: pending.release_id,
        linked_task_ids: pending.linked_task_ids,
        change_summary: pending.change_summary,
        status: "active",
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
      release: readRegistry().releases.find((item) => item.release_id === prodReleaseId),
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
      registry: result.registry,
    })
  );
  if (activityTaskId) {
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
    })
  );
}
