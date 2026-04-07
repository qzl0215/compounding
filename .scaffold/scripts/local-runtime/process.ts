const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const {
  PROD_HOST,
  PROD_PORT,
  PROFILE_LABEL,
  RUNTIME_PROFILE,
  clearLocalState,
  currentReleaseSnapshot,
  ensureLocalRuntimeLayout,
  pidAlive,
  readSharedEnv,
  runtimeRoot,
  writeLocalState,
} = require("./core.ts");

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
    throw new Error(`当前${PROFILE_LABEL}缺少可运行的 release。请先准备并切换对应 release。`);
  }
  if (!current.buildId) {
    throw new Error(`当前${PROFILE_LABEL} release 缺少 BUILD_ID，无法启动。`);
  }

  const { logPath } = ensureLocalRuntimeLayout();
  const logFd = fs.openSync(logPath, "a");
  const env = {
    ...process.env,
    ...readSharedEnv(),
    PORT: String(PROD_PORT),
    HOSTNAME: PROD_HOST,
    AI_OS_RUNTIME_PROFILE: RUNTIME_PROFILE,
    AI_OS_RUNTIME_LABEL: PROFILE_LABEL,
    AI_OS_WORKSPACE_ROOT: path.resolve(process.cwd()),
    AI_OS_RELEASE_ROOT: runtimeRoot(),
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
      runtime_profile: RUNTIME_PROFILE,
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
