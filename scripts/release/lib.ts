const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { releaseReload: releaseReloadImpl } = require("./reload.ts");
const { resolveTaskId, resolveTaskRecord } = require("../ai/lib/task-resolver.ts");
const { parseTaskContract } = require("../../shared/task-contract.ts");
const {
  ensureLayout,
  layoutPaths,
  previewBaseUrl,
  productionBaseUrl,
  runtimeRoot,
  workspaceRoot,
} = require("./runtime-layout.ts");
const {
  clearPendingDevRelease,
  currentActiveRelease,
  emptyRegistry,
  manifestPath,
  markActive,
  pendingDevRelease,
  readManifest,
  readRegistry,
  setPendingDevRelease,
  upsertRelease,
  writeManifest,
  writeRegistry,
} = require("./registry.ts");

function run(command, args, cwd = workspaceRoot()) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function git(args, cwd = workspaceRoot()) {
  return run("git", args, cwd);
}

function resolveCommit(ref) {
  return git(["rev-parse", ref]);
}

function releaseIdFor(commitSha, channel = "prod") {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `${stamp}-${commitSha.slice(0, 7)}-${channel}`;
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
  return releaseReloadImpl(workspaceRoot(), run);
}

function parseTaskIdList(value) {
  if (!value) {
    return [];
  }
  return String(value)
    .split(/[，,、]/)
    .map((item) => item.trim().replace(/\.md$/, ""))
    .filter(Boolean)
    .filter((item, index, values) => values.indexOf(item) === index);
}

function readTaskDeliveryMetadata(taskId) {
  const record = resolveTaskRecord(taskId, workspaceRoot());
  if (!record) {
    throw new Error(`Unknown task: ${taskId}`);
  }
  const file = require("node:path").join(workspaceRoot(), record.path);
  const content = fs.readFileSync(file, "utf8");
  const parsed = parseTaskContract(record.path, content);
  const shortId = parsed.shortId || record.shortId;
  const title = parsed.title || record.title;
  return {
    id: record.id,
    path: record.path,
    short_id: shortId,
    title,
    delivery_snapshot: {
      summary: firstMeaningfulLine(parsed.summary) || `${shortId} ${title}`.trim(),
      risk: firstMeaningfulLine(parsed.risk) || null,
      done_when: firstMeaningfulLine(parsed.doneWhen) || null,
    },
  };
}

function resolveCanonicalTaskIds(taskIds) {
  return Array.from(new Set((taskIds || []).map((taskId) => resolveTaskId(taskId, workspaceRoot())).filter(Boolean)));
}

function updateChannelSymlink(target, channel = "prod") {
  const { currentLink, previewCurrentLink } = ensureLayout();
  const linkPath = channel === "dev" ? previewCurrentLink : currentLink;
  const temp = `${linkPath}.next`;
  fs.rmSync(temp, { force: true, recursive: true });
  fs.symlinkSync(target, temp, "dir");
  try {
    fs.renameSync(temp, linkPath);
  } catch {
    fs.rmSync(linkPath, { force: true, recursive: true });
    fs.renameSync(temp, linkPath);
  }
  return target;
}

function buildReleaseAtPath(releasePath) {
  run("pnpm", ["install", "--frozen-lockfile=false"], releasePath);
  run("pnpm", ["build"], releasePath);
}

function hasBuildArtifacts(releasePath) {
  return fs.existsSync(path.join(releasePath, "apps", "studio", ".next", "BUILD_ID"));
}

function ensureProdRuntimeSource(releaseId, commitSha, sourceReleasePath = null) {
  if (sourceReleasePath && fs.existsSync(sourceReleasePath) && hasBuildArtifacts(sourceReleasePath)) {
    return { sourcePath: sourceReleasePath, cleanup: null };
  }

  const { root } = ensureLayout();
  const tempSourcePath = path.join(root, "materialize-tmp", releaseId);
  fs.rmSync(tempSourcePath, { force: true, recursive: true });
  fs.mkdirSync(path.dirname(tempSourcePath), { recursive: true });
  git(["worktree", "add", "--detach", tempSourcePath, commitSha]);
  try {
    git(["clean", "-fdx"], tempSourcePath);
    buildReleaseAtPath(tempSourcePath);
  } catch (error) {
    git(["worktree", "remove", "--force", tempSourcePath]);
    git(["worktree", "prune"]);
    throw error;
  }

  return {
    sourcePath: tempSourcePath,
    cleanup: () => {
      git(["worktree", "remove", "--force", tempSourcePath]);
      git(["worktree", "prune"]);
    },
  };
}

function materializeProdRuntime(sourceReleasePath, releaseId, commitSha) {
  const { prodLiveDir } = ensureLayout();
  const targetPath = path.join(prodLiveDir, releaseId);
  const stagePath = `${targetPath}.next`;
  const prepared = ensureProdRuntimeSource(releaseId, commitSha, sourceReleasePath);
  try {
    fs.rmSync(stagePath, { force: true, recursive: true });
    fs.cpSync(prepared.sourcePath, stagePath, {
      recursive: true,
      force: true,
      dereference: true,
      filter: (source) => path.basename(source) !== ".git",
    });
    run("pnpm", ["install", "--frozen-lockfile=false"], stagePath);
    fs.rmSync(targetPath, { force: true, recursive: true });
    fs.renameSync(stagePath, targetPath);
    return targetPath;
  } finally {
    prepared.cleanup?.();
  }
}

function pruneInactiveProdRuntimeCopies(activeReleaseId) {
  const { prodLiveDir } = ensureLayout();
  if (!fs.existsSync(prodLiveDir)) {
    return;
  }
  for (const entry of fs.readdirSync(prodLiveDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    if (entry.name === activeReleaseId || entry.name.endsWith(".next")) {
      continue;
    }
    fs.rmSync(path.join(prodLiveDir, entry.name), { force: true, recursive: true });
  }
}

function clearChannelSymlink(channel = "dev") {
  const { currentLink, previewCurrentLink } = ensureLayout();
  fs.rmSync(channel === "dev" ? previewCurrentLink : currentLink, { force: true, recursive: true });
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

function firstMeaningfulLine(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .find(Boolean) || "";
}

module.exports = {
  changeSummary,
  clearChannelSymlink,
  clearPendingDevRelease,
  currentActiveRelease,
  emptyRegistry,
  ensureLayout,
  ensureReleaseTag,
  git,
  layoutPaths,
  manifestPath,
  markActive,
  materializeProdRuntime,
  pendingDevRelease,
  previewBaseUrl,
  pruneInactiveProdRuntimeCopies,
  parseTaskIdList,
  productionBaseUrl,
  readManifest,
  readRegistry,
  readTaskDeliveryMetadata,
  releaseIdFor,
  releaseReload,
  resolveCanonicalTaskIds,
  resolveCommit,
  run,
  runtimeRoot,
  setPendingDevRelease,
  updateChannelSymlink,
  upsertRelease,
  withReleaseLock,
  workspaceRoot,
  writeManifest,
  writeRegistry,
};
