const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

function commandExists(command) {
  try {
    execFileSync("which", [command], { stdio: ["ignore", "ignore", "ignore"] });
    return true;
  } catch {
    return false;
  }
}

function releaseReload(workspaceRoot, runCommand) {
  if (process.env.AI_OS_RELOAD_COMMAND) {
    runCommand("sh", ["-lc", process.env.AI_OS_RELOAD_COMMAND]);
    return "custom reload command executed";
  }
  if (process.env.AI_OS_SYSTEMD_SERVICE && commandExists("systemctl")) {
    runCommand("systemctl", ["restart", process.env.AI_OS_SYSTEMD_SERVICE]);
    return `systemd restarted ${process.env.AI_OS_SYSTEMD_SERVICE}`;
  }

  const localRuntimeStatus = path.join(workspaceRoot, "scripts", "local-runtime", "status-prod.ts");
  const localRuntimeRestart = path.join(workspaceRoot, "scripts", "local-runtime", "restart-prod.ts");
  if (fs.existsSync(localRuntimeStatus) && fs.existsSync(localRuntimeRestart)) {
    try {
      const statusRaw = runCommand("node", ["--experimental-strip-types", localRuntimeStatus]);
      const status = JSON.parse(statusRaw);
      if (status.status === "running" || status.status === "drift" || status.status === "port_error") {
        const restartRaw = runCommand("node", ["--experimental-strip-types", localRuntimeRestart]);
        const restart = JSON.parse(restartRaw);
        return restart.message || "local runtime restarted";
      }
      if (status.status === "unmanaged") {
        return status.reason || "reload skipped (port is occupied by an unmanaged process)";
      }
      return "reload skipped (local production not running)";
    } catch (error) {
      return error instanceof Error ? `reload skipped (${error.message})` : "reload skipped (local runtime unavailable)";
    }
  }

  return "reload skipped (no AI_OS_RELOAD_COMMAND, no AI_OS_SYSTEMD_SERVICE, and no local runtime fallback)";
}

module.exports = {
  releaseReload,
};
