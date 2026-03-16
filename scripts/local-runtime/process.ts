const { spawn } = require("node:child_process");
const fs = require("node:fs");
const { PROD_HOST, PROD_PORT, clearLocalState, currentReleaseSnapshot, ensureLocalRuntimeLayout, pidAlive, readSharedEnv, writeLocalState } = require("./core.ts");

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function stopProcess(pid) {
  if (!pidAlive(pid)) {
    return;
  }
  process.kill(Number(pid), "SIGTERM");
}

async function waitForExit(pid, timeoutMs = 8000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (!pidAlive(pid)) {
      return true;
    }
    await sleep(250);
  }
  return !pidAlive(pid);
}

function spawnLocalProduction() {
  const current = currentReleaseSnapshot();
  if (!current.releasePath || !current.studioPath || !current.nextBin) {
    throw new Error("Current release is missing or incomplete. Run release prepare/switch before starting production.");
  }
  if (!current.buildId) {
    throw new Error("Current release has no BUILD_ID. Build the release before starting production.");
  }

  const { logPath } = ensureLocalRuntimeLayout();
  const logFd = fs.openSync(logPath, "a");
  const env = {
    ...process.env,
    ...readSharedEnv(),
    PORT: String(PROD_PORT),
    HOSTNAME: PROD_HOST,
  };

  const child = spawn(process.execPath, [current.nextBin, "start", "--hostname", PROD_HOST, "--port", String(PROD_PORT)], {
    cwd: current.studioPath,
    detached: true,
    stdio: ["ignore", logFd, logFd],
    env,
  });
  child.unref();

  return {
    pid: child.pid,
    state: writeLocalState({
      pid: child.pid,
      port: PROD_PORT,
      host: PROD_HOST,
      started_at: new Date().toISOString(),
      runtime_release_id: current.releaseId,
      cwd: current.studioPath,
      log_path: logPath,
      build_id: current.buildId,
    }),
  };
}

module.exports = {
  clearLocalState,
  spawnLocalProduction,
  stopProcess,
  waitForExit,
};
