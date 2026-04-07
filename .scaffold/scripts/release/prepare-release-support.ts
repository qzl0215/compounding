const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");
const { buildTaskCostSnapshot } = require("../ai/lib/task-cost-core.ts");
const { previewBaseUrl, updateChannelSymlink } = require("./lib.ts");
const { transitionReleaseRecord } = require("../../shared/release-state-machine.ts");

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

function installAndBuildRelease(releasePath) {
  childProcess.execFileSync("pnpm", ["install", "--frozen-lockfile=false"], {
    cwd: releasePath,
    stdio: ["ignore", "pipe", "pipe"],
  });
  childProcess.execFileSync("pnpm", ["build"], {
    cwd: releasePath,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function hasBuildSmokeSignal(releasePath) {
  const buildIdPath = path.join(releasePath, "apps", "studio", ".next", "BUILD_ID");
  return fs.existsSync(buildIdPath);
}

function createReleaseRecord({
  releaseId,
  commitSha,
  ref,
  channel,
  taskMeta,
  linkedTaskIds,
  releasePath,
  summary,
  createdAt,
  status,
  buildResult,
  smokeResult,
  notes,
}) {
  const record = {
    release_id: releaseId,
    commit_sha: commitSha,
    tag: null,
    source_ref: ref,
    primary_task_id: taskMeta?.id || null,
    linked_task_ids: linkedTaskIds,
    delivery_snapshot: buildResult === "passed" ? taskMeta?.delivery_snapshot || null : null,
    channel,
    acceptance_status: channel === "dev" ? (buildResult === "passed" ? "pending" : "rejected") : "accepted",
    preview_url: channel === "dev" ? previewBaseUrl() : null,
    promoted_to_main_at: null,
    promoted_from_dev_release_id: null,
    created_at: createdAt,
    status: status === "failed" ? "failed" : "prepared",
    build_result: buildResult,
    smoke_result: smokeResult,
    cutover_at: null,
    rollback_from: null,
    release_path: releasePath,
    change_summary: summary,
    notes,
  };

  let prepared = transitionReleaseRecord(record, "prepare_release", {
    channel: channel,
    recorded_at: createdAt,
    source: "release:prepare",
  });

  if (status === "failed") {
    prepared = transitionReleaseRecord(prepared, "fail_release", {
      channel,
      recorded_at: createdAt,
      source: "release:prepare",
      reason: notes[0] || "release build failed",
    });
  }

  if (buildResult === "passed" && taskMeta?.id && record.delivery_snapshot) {
    prepared.delivery_snapshot = {
      ...prepared.delivery_snapshot,
      change_cost: buildTaskCostSnapshot(process.cwd(), {
        taskId: taskMeta.id,
        deliveryStatus: channel === "dev" ? "pending_acceptance" : "released",
        versionLabel: releaseId,
        associatedReleases: [prepared],
      }),
    };
  }

  return prepared;
}

module.exports = {
  createReleaseRecord,
  ensurePreviewAvailable,
  hasBuildSmokeSignal,
  installAndBuildRelease,
};
