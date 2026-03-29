const {
  currentActiveRelease,
  detachReleaseWorktrees,
  materializeProdRuntime,
  markActive,
  productionBaseUrl,
  pruneInactiveProdRuntimeCopies,
  readManifest,
  readRegistry,
  releaseReload,
  run,
  updateChannelSymlink,
  upsertRelease,
  withReleaseLock,
} = require("./lib.ts");
const { stabilizeLocalProdRuntime } = require("./prod-runtime-stability.ts");
const { finishActiveStage, recordBlocker, startActiveStage } = require("../coord/lib/task-activity.ts");
const { recordReleaseCleanupCancellation } = require("../coord/lib/companion-lifecycle.ts");
const { refreshLearningCandidatesSnapshot } = require("../ai/lib/learning-candidates.ts");

function parseArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return null;
  }
  return process.argv[index + 1] || null;
}

const releaseId = parseArg("--release");
let activityTaskId = null;

if (!releaseId) {
  console.error(JSON.stringify({ ok: false, message: "Missing --release <release-id>." }));
  process.exit(1);
}

try {
  const result = withReleaseLock(() => {
    const previous = currentActiveRelease();
    const target = readManifest(releaseId);
    activityTaskId = target.primary_task_id || previous?.primary_task_id || null;
    if (activityTaskId) {
      startActiveStage(activityTaskId, "rollback", {
        source: "release:rollback",
        status: "running",
        reason: `开始回滚到 ${releaseId}。`,
      });
    }
    if (!target.release_path) {
      throw new Error(`Release ${releaseId} has no release path.`);
    }

    const prodRuntimePath = materializeProdRuntime(target.release_path, releaseId, target.commit_sha);
    updateChannelSymlink(prodRuntimePath, "prod");
    const reloadNote = releaseReload();
    markActive(releaseId, previous?.release_id || null);
    const stabilityNote = stabilizeLocalProdRuntime(process.cwd(), run, releaseId);
    const updated = readRegistry().releases.find((item) => item.release_id === releaseId) || target;
    const finalRelease = { ...updated, notes: [...updated.notes, reloadNote, stabilityNote].filter(Boolean) };
    upsertRelease(finalRelease);
    pruneInactiveProdRuntimeCopies(releaseId);
    detachReleaseWorktrees([target.release_path, previous?.release_path]);
    return { registry: readRegistry(), finalRelease, previousRelease: previous };
  });

  console.log(
    JSON.stringify({
      ok: true,
      message: `Rolled back to ${releaseId}.`,
      release: result.finalRelease,
      links: { production: productionBaseUrl() },
      learning_candidates_path: refreshLearningCandidatesSnapshot(process.cwd(), { taskId: activityTaskId }).json_path || null,
      registry: result.registry,
    })
  );
  if (activityTaskId) {
    finishActiveStage(activityTaskId, "rollback", {
      source: "release:rollback",
      status: "rolled_back",
      reason: `已回滚到 ${releaseId}。`,
    });
  }
  if (result.previousRelease?.primary_task_id) {
    recordReleaseCleanupCancellation(result.previousRelease.primary_task_id, {
      linked_task_ids: result.previousRelease.linked_task_ids,
      reason: "release_rolled_back",
    });
  }
} catch (error) {
  if (activityTaskId) {
    recordBlocker(activityTaskId, "rollback", {
      source: "release:rollback",
      status: "failed",
      reason: error instanceof Error ? error.message : "Rollback failed.",
      relatedDocs: ["docs/DEV_WORKFLOW.md"],
    });
    finishActiveStage(activityTaskId, "rollback", {
      source: "release:rollback",
      status: "failed",
      reason: error instanceof Error ? error.message : "Rollback failed.",
    });
  }
  console.log(
    JSON.stringify({
      ok: false,
      message: error instanceof Error ? error.message : "Rollback failed.",
      learning_candidates_path: refreshLearningCandidatesSnapshot(process.cwd(), { taskId: activityTaskId }).json_path || null,
    })
  );
}
