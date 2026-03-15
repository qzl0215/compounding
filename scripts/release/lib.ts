const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

function workspaceRoot() {
  return process.cwd();
}

function runtimeRoot() {
  return process.env.AI_OS_RELEASE_ROOT || path.resolve(workspaceRoot(), "..", ".compounding-runtime");
}

function layoutPaths() {
  const root = runtimeRoot();
  return {
    root,
    releasesDir: path.join(root, "releases"),
    sharedDir: path.join(root, "shared"),
    currentLink: path.join(root, "current"),
    registryPath: path.join(root, "registry.json"),
    sharedEnvPath: path.join(root, "shared", "portal.env"),
    lockPath: path.join(root, "release.lock"),
  };
}

function ensureLayout() {
  const layout = layoutPaths();
  fs.mkdirSync(layout.releasesDir, { recursive: true });
  fs.mkdirSync(layout.sharedDir, { recursive: true });
  bootstrapSharedEnv(layout.sharedEnvPath);
  return layout;
}

function bootstrapSharedEnv(sharedEnvPath) {
  if (fs.existsSync(sharedEnvPath)) {
    return;
  }
  for (const candidate of [".env.local", ".env"]) {
    const source = path.join(workspaceRoot(), candidate);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, sharedEnvPath);
      return;
    }
  }
}

function emptyRegistry() {
  return { active_release_id: null, updated_at: null, releases: [] };
}

function readRegistry() {
  const { registryPath } = ensureLayout();
  if (!fs.existsSync(registryPath)) {
    return emptyRegistry();
  }
  try {
    return JSON.parse(fs.readFileSync(registryPath, "utf8"));
  } catch {
    return emptyRegistry();
  }
}

function writeRegistry(registry) {
  const { registryPath } = ensureLayout();
  registry.updated_at = new Date().toISOString();
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + "\n");
}

function manifestPath(releaseId) {
  return path.join(ensureLayout().releasesDir, releaseId, "release-manifest.json");
}

function writeManifest(record) {
  fs.writeFileSync(manifestPath(record.release_id), JSON.stringify(record, null, 2) + "\n");
}

function readManifest(releaseId) {
  const file = manifestPath(releaseId);
  if (!fs.existsSync(file)) {
    throw new Error(`Unknown release: ${releaseId}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function run(command, args, cwd = workspaceRoot()) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function commandExists(command) {
  try {
    execFileSync("which", [command], { stdio: ["ignore", "ignore", "ignore"] });
    return true;
  } catch {
    return false;
  }
}

function git(args, cwd = workspaceRoot()) {
  return run("git", args, cwd);
}

function resolveCommit(ref) {
  return git(["rev-parse", ref]);
}

function releaseIdFor(commitSha) {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `${stamp}-${commitSha.slice(0, 7)}`;
}

function changeSummary(fromSha, toSha) {
  const range = fromSha ? `${fromSha}..${toSha}` : toSha;
  try {
    const output = git(["log", "--max-count=8", "--pretty=format:%h %s", range]);
    return output ? output.split("\n").filter(Boolean) : [];
  } catch {
    return [];
  }
}

function ensureReleaseTag(tag, commitSha) {
  try {
    git(["rev-parse", "-q", "--verify", `refs/tags/${tag}`]);
    return tag;
  } catch {
    git(["tag", "-a", tag, commitSha, "-m", `release ${tag}`]);
    return tag;
  }
}

function releaseReload() {
  if (process.env.AI_OS_RELOAD_COMMAND) {
    run("sh", ["-lc", process.env.AI_OS_RELOAD_COMMAND]);
    return "custom reload command executed";
  }
  if (process.env.AI_OS_SYSTEMD_SERVICE && commandExists("systemctl")) {
    run("systemctl", ["restart", process.env.AI_OS_SYSTEMD_SERVICE]);
    return `systemd restarted ${process.env.AI_OS_SYSTEMD_SERVICE}`;
  }
  return "reload skipped (no AI_OS_RELOAD_COMMAND or AI_OS_SYSTEMD_SERVICE configured)";
}

function updateCurrentSymlink(releaseId) {
  const { releasesDir, currentLink } = ensureLayout();
  const target = path.join(releasesDir, releaseId);
  const temp = `${currentLink}.next`;
  fs.rmSync(temp, { force: true, recursive: true });
  fs.symlinkSync(target, temp, "dir");
  try {
    fs.renameSync(temp, currentLink);
  } catch {
    fs.rmSync(currentLink, { force: true, recursive: true });
    fs.renameSync(temp, currentLink);
  }
  return target;
}

function upsertRelease(record) {
  const registry = readRegistry();
  const existingIndex = registry.releases.findIndex((item) => item.release_id === record.release_id);
  if (existingIndex >= 0) {
    registry.releases[existingIndex] = record;
  } else {
    registry.releases.push(record);
  }
  writeRegistry(registry);
  writeManifest(record);
  return registry;
}

function markActive(releaseId, rollbackFrom = null) {
  const registry = readRegistry();
  const now = new Date().toISOString();
  registry.active_release_id = releaseId;
  registry.releases = registry.releases.map((item) => {
    if (item.release_id === releaseId) {
      return {
        ...item,
        status: "active",
        cutover_at: now,
        rollback_from: rollbackFrom,
      };
    }
    if (item.status === "active") {
      return { ...item, status: rollbackFrom ? "rolled_back" : "superseded", rollback_from: null };
    }
    return item;
  });
  writeRegistry(registry);
  registry.releases.forEach((item) => writeManifest(item));
  return registry;
}

function currentActiveRelease(registry = readRegistry()) {
  return registry.releases.find((item) => item.release_id === registry.active_release_id) || null;
}
function withReleaseLock(callback) {
  const { lockPath } = ensureLayout();
  let descriptor;
  try {
    descriptor = fs.openSync(lockPath, "wx");
  } catch (error) {
    if (error && error.code === "EEXIST") {
      throw new Error("Another release operation is already running.");
    }
    throw error;
  }

  try {
    fs.writeFileSync(descriptor, JSON.stringify({ pid: process.pid, created_at: new Date().toISOString() }));
    return callback();
  } finally {
    if (descriptor !== undefined) {
      fs.closeSync(descriptor);
    }
    fs.rmSync(lockPath, { force: true });
  }
}
module.exports = {
  changeSummary,
  currentActiveRelease,
  emptyRegistry,
  ensureLayout,
  ensureReleaseTag,
  git,
  layoutPaths,
  manifestPath,
  markActive,
  readManifest,
  readRegistry,
  releaseIdFor,
  releaseReload,
  resolveCommit,
  run,
  runtimeRoot,
  updateCurrentSymlink,
  upsertRelease,
  withReleaseLock,
  writeManifest,
  writeRegistry,
};
