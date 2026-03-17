const { PROD_PORT, PROFILE_LABEL, currentReleaseSnapshot, ensureLocalRuntimeLayout, listPortListener, pidAlive, readLocalState } = require("./core.ts");

function managedListenerMatches(state, listener) {
  return Boolean(state?.pid && listener?.pid && Number(state.pid) === Number(listener.pid));
}

function detectLocalProdStatus() {
  const paths = ensureLocalRuntimeLayout();
  const current = currentReleaseSnapshot();
  const state = readLocalState();
  const listener = listPortListener(PROD_PORT);
  const alive = pidAlive(state?.pid);
  const runtimeReleaseId = state?.runtime_release_id || null;
  const currentReleaseId = current.releaseId || null;
  const drift = Boolean(runtimeReleaseId && currentReleaseId && runtimeReleaseId !== currentReleaseId);

  if (!state) {
    if (listener?.pid) {
      return {
        status: "unmanaged",
        running: false,
        port: PROD_PORT,
        pid: null,
        runtime_release_id: null,
        current_release_id: currentReleaseId,
        drift: false,
        reason: `端口 ${PROD_PORT} 被未托管进程占用：${listener.command || "unknown"} (${listener.pid || "unknown"})`,
        log_path: paths.logPath,
        state_path: paths.statePath,
      };
    }
    return {
      status: "stopped",
      running: false,
      port: PROD_PORT,
      pid: null,
      runtime_release_id: null,
      current_release_id: currentReleaseId,
      drift: false,
        reason: `${PROFILE_LABEL}未启动。`,
      log_path: paths.logPath,
      state_path: paths.statePath,
    };
  }

  if (!alive) {
    return {
      status: "stale_pid",
      running: false,
      port: PROD_PORT,
      pid: Number(state.pid) || null,
      runtime_release_id: runtimeReleaseId,
      current_release_id: currentReleaseId,
      drift,
        reason: `${PROFILE_LABEL}记录的 PID ${state.pid} 已失效。`,
      log_path: state.log_path || paths.logPath,
      state_path: paths.statePath,
    };
  }

  if (!listener?.pid) {
    return {
      status: "port_error",
      running: false,
      port: PROD_PORT,
      pid: Number(state.pid) || null,
      runtime_release_id: runtimeReleaseId,
      current_release_id: currentReleaseId,
      drift,
        reason: `${PROFILE_LABEL}的 PID ${state.pid} 仍存活，但 ${PROD_PORT} 端口没有监听。`,
      log_path: state.log_path || paths.logPath,
      state_path: paths.statePath,
    };
  }

  if (!managedListenerMatches(state, listener)) {
    return {
      status: "port_error",
      running: false,
      port: PROD_PORT,
      pid: Number(state.pid) || null,
      runtime_release_id: runtimeReleaseId,
      current_release_id: currentReleaseId,
      drift,
      reason: `端口 ${PROD_PORT} 当前由 PID ${listener.pid} (${listener.command || "unknown"}) 监听，与托管 PID ${state.pid} 不一致。`,
      log_path: state.log_path || paths.logPath,
      state_path: paths.statePath,
    };
  }

  if (drift) {
    return {
      status: "drift",
      running: true,
      port: PROD_PORT,
      pid: Number(state.pid) || null,
      runtime_release_id: runtimeReleaseId,
      current_release_id: currentReleaseId,
      drift: true,
        reason: `${PROFILE_LABEL}运行中的版本 ${runtimeReleaseId} 与当前软链指向的版本 ${currentReleaseId} 不一致。`,
      log_path: state.log_path || paths.logPath,
      state_path: paths.statePath,
    };
  }

  return {
    status: "running",
    running: true,
    port: PROD_PORT,
    pid: Number(state.pid) || null,
    runtime_release_id: runtimeReleaseId,
    current_release_id: currentReleaseId,
    drift: false,
      reason: `${PROFILE_LABEL}正在运行，监听 127.0.0.1:${PROD_PORT}。`,
    log_path: state.log_path || paths.logPath,
    state_path: paths.statePath,
  };
}

module.exports = {
  detectLocalProdStatus,
};
