const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { ensureLayout, layoutPaths, runtimeRoot } = require("../release/lib.ts");

const PROD_PORT = Number(process.env.AI_OS_LOCAL_PROD_PORT || "3000");
const PROD_HOST = process.env.AI_OS_LOCAL_PROD_HOST || "127.0.0.1";
const PROD_BASE_URL = `http://${PROD_HOST}:${PROD_PORT}`;

function localRuntimePaths() {
  const layout = layoutPaths();
  return {
    ...layout,
    pidPath: path.join(layout.sharedDir, "local-prod.pid"),
    logPath: path.join(layout.sharedDir, "local-prod.log"),
    statePath: path.join(layout.sharedDir, "local-prod.json"),
  };
}

function ensureLocalRuntimeLayout() {
  ensureLayout();
  return localRuntimePaths();
}

function currentReleaseSnapshot() {
  const { currentLink } = ensureLocalRuntimeLayout();
  if (!fs.existsSync(currentLink)) {
    return {
      releaseId: null,
      releasePath: null,
      studioPath: null,
      buildId: null,
      nextBin: null,
    };
  }

  const releasePath = fs.realpathSync(currentLink);
  const releaseId = path.basename(releasePath);
  const studioPath = path.join(releasePath, "apps", "studio");
  const buildIdPath = path.join(studioPath, ".next", "BUILD_ID");
  const nextBin = path.join(studioPath, "node_modules", "next", "dist", "bin", "next");

  return {
    releaseId,
    releasePath,
    studioPath,
    buildId: fs.existsSync(buildIdPath) ? fs.readFileSync(buildIdPath, "utf8").trim() : null,
    nextBin: fs.existsSync(nextBin) ? nextBin : null,
  };
}

function readLocalState() {
  const { statePath } = ensureLocalRuntimeLayout();
  if (!fs.existsSync(statePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    return null;
  }
}

function writeLocalState(state) {
  const { statePath, pidPath } = ensureLocalRuntimeLayout();
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n", "utf8");
  fs.writeFileSync(pidPath, `${state.pid}\n`, "utf8");
  return state;
}

function clearLocalState() {
  const { statePath, pidPath } = ensureLocalRuntimeLayout();
  fs.rmSync(statePath, { force: true });
  fs.rmSync(pidPath, { force: true });
}

function pidAlive(pid) {
  if (!pid) {
    return false;
  }
  try {
    process.kill(Number(pid), 0);
    return true;
  } catch {
    return false;
  }
}

function listPortListener(port = PROD_PORT) {
  try {
    const output = execFileSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const lines = output.split("\n");
    if (lines.length < 2) {
      return null;
    }
    const parts = lines[1].trim().split(/\s+/);
    return {
      command: parts[0] || null,
      pid: parts[1] ? Number(parts[1]) : null,
      raw: lines[1],
    };
  } catch {
    return null;
  }
}

function parseEnvFile(text) {
  const env = {};
  for (const line of String(text || "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const index = trimmed.indexOf("=");
    if (index === -1) {
      continue;
    }
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function readSharedEnv() {
  const { sharedEnvPath } = ensureLocalRuntimeLayout();
  if (!fs.existsSync(sharedEnvPath)) {
    return {};
  }
  return parseEnvFile(fs.readFileSync(sharedEnvPath, "utf8"));
}

module.exports = {
  PROD_BASE_URL,
  PROD_HOST,
  PROD_PORT,
  clearLocalState,
  currentReleaseSnapshot,
  ensureLocalRuntimeLayout,
  listPortListener,
  localRuntimePaths,
  parseEnvFile,
  pidAlive,
  readLocalState,
  readSharedEnv,
  runtimeRoot,
  writeLocalState,
};
