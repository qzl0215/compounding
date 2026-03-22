const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const { releaseReload: releaseReloadImpl } = require("./reload.ts");
const { extractSection, stripMarkdown } = require("../ai/lib/markdown-sections.ts");
const { resolveTaskId, resolveTaskRecord } = require("../ai/lib/task-resolver.ts");
const { readCompanionReleaseContext } = require("../coord/lib/task-meta.ts");
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

function firstMeaningfulLine(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => stripMarkdown(line).replace(/^[-*]\s*/, "").trim())
    .find(Boolean) || "";
}

function readTaskDeliveryMetadata(taskId) {
  const record = resolveTaskRecord(taskId, workspaceRoot());
  if (!record) {
    throw new Error(`Unknown task: ${taskId}`);
  }
  const file = require("node:path").join(workspaceRoot(), record.path);
  const content = fs.readFileSync(file, "utf8");
  const shortId = stripMarkdown(extractSection(content, "short_id", workspaceRoot()) || record.shortId);
  const title = record.title;
  const benefit = firstMeaningfulLine(
    extractSection(content, "delivery_benefit", workspaceRoot()) || extractSection(content, "goal", workspaceRoot()) || ""
  );
  const risk = firstMeaningfulLine(
    extractSection(content, "delivery_risk", workspaceRoot()) || extractSection(content, "risks", workspaceRoot()) || ""
  );
  const companionContext = readCompanionReleaseContext(record.id);
  return {
    id: record.id,
    path: record.path,
    short_id: shortId,
    title,
    delivery_summary: companionContext?.delivery_summary || `${shortId} ${title}`.trim(),
    delivery_benefit: companionContext?.delivery_benefit || benefit || null,
    delivery_risks: companionContext?.delivery_risks || risk || null,
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
  pendingDevRelease,
  previewBaseUrl,
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
