const fs = require("node:fs");
const path = require("node:path");

function runtimeScriptPath(workspaceRoot, scriptName) {
  return path.join(workspaceRoot, "scripts", "local-runtime", scriptName);
}

function scriptExists(workspaceRoot, scriptName) {
  return fs.existsSync(runtimeScriptPath(workspaceRoot, scriptName));
}

function readProdStatus(workspaceRoot, runCommand) {
  const statusPath = runtimeScriptPath(workspaceRoot, "status-prod.ts");
  return JSON.parse(runCommand("node", ["--experimental-strip-types", statusPath]));
}

function restartProd(workspaceRoot, runCommand) {
  const restartPath = runtimeScriptPath(workspaceRoot, "restart-prod.ts");
  return JSON.parse(runCommand("node", ["--experimental-strip-types", restartPath]));
}

function isSettled(status, expectedReleaseId) {
  return (
    status.status === "running" &&
    !status.drift &&
    status.runtime_release_id === expectedReleaseId &&
    status.current_release_id === expectedReleaseId
  );
}

function stabilizeLocalProdRuntime(workspaceRoot, runCommand, expectedReleaseId) {
  if (!scriptExists(workspaceRoot, "status-prod.ts") || !scriptExists(workspaceRoot, "restart-prod.ts")) {
    return null;
  }

  const current = readProdStatus(workspaceRoot, runCommand);
  if (current.status === "unmanaged") {
    return current.reason || "local production is occupied by an unmanaged process";
  }
  if (current.status === "stopped") {
    return "local production is not running";
  }
  if (isSettled(current, expectedReleaseId)) {
    return null;
  }

  const restart = restartProd(workspaceRoot, runCommand);
  const after = readProdStatus(workspaceRoot, runCommand);
  if (!isSettled(after, expectedReleaseId)) {
    throw new Error(`Production runtime did not settle on ${expectedReleaseId}.`);
  }
  return restart.message || `local production stabilized on ${expectedReleaseId}`;
}

module.exports = {
  stabilizeLocalProdRuntime,
};
