const childProcess = require("node:child_process");
const path = require("node:path");
const { finishWaitStageIfOpen, recordBlocker } = require("../coord/lib/task-activity.ts");
const {
  clearChannelSymlink,
  clearPendingDevRelease,
  pendingDevRelease,
  previewBaseUrl,
  productionBaseUrl,
  repairRegistry,
  readManifest,
  readRegistry,
  upsertRelease,
  withReleaseLock,
} = require("./lib.ts");

function parseArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return null;
  }
  return process.argv[index + 1] || null;
}

const releaseId = parseArg("--release");
let activityTaskId = null;

try {
  const result = withReleaseLock(() => {
    const pending = releaseId ? readManifest(releaseId) : pendingDevRelease(repairRegistry());
    if (!pending || pending.channel !== "dev" || pending.acceptance_status !== "pending") {
      throw new Error("当前没有可驳回的 pending dev 预览。");
    }
    activityTaskId = pending.primary_task_id || null;

    const rejected = {
      ...pending,
      status: "rejected",
      acceptance_status: "rejected",
      notes: [...pending.notes, "Rejected during dev preview acceptance."],
    };
    upsertRelease(rejected);
    clearPendingDevRelease();
    clearChannelSymlink("dev");

    const stopPreviewScript = path.join(process.cwd(), "scripts", "local-runtime", "stop-preview.ts");
    try {
      childProcess.execFileSync("node", ["--experimental-strip-types", stopPreviewScript], {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch {}

    return { release: rejected, registry: readRegistry() };
  });

  console.log(
    JSON.stringify({
      ok: true,
      message: "当前 dev 预览已驳回，可继续修改后重新生成预览。",
      release: result.release,
      links: {
        dev: previewBaseUrl(),
        production: productionBaseUrl(),
      },
      registry: result.registry,
    })
  );
  if (activityTaskId) {
    recordBlocker(activityTaskId, "acceptance_wait", {
      source: "release:reject-dev",
      status: "rejected",
      reason: "dev 预览在验收阶段被驳回。",
      relatedDocs: ["docs/DEV_WORKFLOW.md"],
    });
    finishWaitStageIfOpen(activityTaskId, "acceptance_wait", {
      source: "release:reject-dev",
      status: "rejected",
      reason: "dev 预览被驳回，等待重新修改。",
    });
  }
} catch (error) {
  if (activityTaskId) {
    recordBlocker(activityTaskId, "acceptance_wait", {
      source: "release:reject-dev",
      status: "failed",
      reason: error instanceof Error ? error.message : "Failed to reject dev release.",
      relatedDocs: ["docs/DEV_WORKFLOW.md"],
    });
  }
  console.log(
    JSON.stringify({
      ok: false,
      message: error instanceof Error ? error.message : "Failed to reject dev release.",
      links: {
        dev: previewBaseUrl(),
        production: productionBaseUrl(),
      },
    })
  );
}
