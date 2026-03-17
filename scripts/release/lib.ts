const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { releaseReload: releaseReloadImpl } = require("./reload.ts");
const { extractSection, stripMarkdown } = require("../ai/lib/markdown-sections.ts");

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
    previewCurrentLink: path.join(root, "preview-current"),
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
  return { active_release_id: null, pending_dev_release_id: null, updated_at: null, releases: [] };
}

function readRegistry() {
  const { registryPath } = ensureLayout();
  if (!fs.existsSync(registryPath)) {
    return emptyRegistry();
  }
  try {
    const raw = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    return {
      active_release_id: raw.active_release_id ?? null,
      pending_dev_release_id: raw.pending_dev_release_id ?? null,
      updated_at: raw.updated_at ?? null,
      releases: Array.isArray(raw.releases) ? raw.releases.map(normalizeReleaseRecord) : [],
    };
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
  const file = manifestPath(record.release_id);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(record, null, 2) + "\n");
}

function readManifest(releaseId) {
  const file = manifestPath(releaseId);
  if (!fs.existsSync(file)) {
    throw new Error(`Unknown release: ${releaseId}`);
  }
  return normalizeReleaseRecord(JSON.parse(fs.readFileSync(file, "utf8")));
}

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

function taskQueueDir() {
  return path.join(workspaceRoot(), "tasks", "queue");
}

function taskPathForId(taskId) {
  const normalized = String(taskId || "").replace(/\.md$/, "").trim();
  return normalized ? path.join(taskQueueDir(), `${normalized}.md`) : "";
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
  const file = taskPathForId(taskId);
  if (!file || !fs.existsSync(file)) {
    throw new Error(`Unknown task: ${taskId}`);
  }
  const content = fs.readFileSync(file, "utf8");
  const shortId = stripMarkdown(extractSection(content, "short_id", workspaceRoot()) || taskId);
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : taskId;
  const benefit = firstMeaningfulLine(extractSection(content, "delivery_benefit", workspaceRoot()) || extractSection(content, "goal", workspaceRoot()) || "");
  const risk = firstMeaningfulLine(extractSection(content, "delivery_risk", workspaceRoot()) || extractSection(content, "risks", workspaceRoot()) || "");
  return {
    id: taskId,
    short_id: shortId,
    title,
    delivery_summary: `${shortId} ${title}`.trim(),
    delivery_benefit: benefit || null,
    delivery_risks: risk || null,
  };
}

function firstMeaningfulLine(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => stripMarkdown(line).replace(/^[-*]\s*/, "").trim())
    .find(Boolean) || "";
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

function upsertRelease(record) {
  const registry = readRegistry();
  const normalizedRecord = normalizeReleaseRecord(record);
  const existingIndex = registry.releases.findIndex((item) => item.release_id === normalizedRecord.release_id);
  if (existingIndex >= 0) {
    registry.releases[existingIndex] = normalizedRecord;
  } else {
    registry.releases.push(normalizedRecord);
  }
  writeRegistry(registry);
  writeManifest(normalizedRecord);
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
        channel: "prod",
        acceptance_status: "accepted",
        status: "active",
        cutover_at: now,
        rollback_from: rollbackFrom,
      };
    }
    if (item.channel === "prod" && item.status === "active") {
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

function pendingDevRelease(registry = readRegistry()) {
  const direct = registry.pending_dev_release_id
    ? registry.releases.find((item) => item.release_id === registry.pending_dev_release_id)
    : null;
  if (direct) {
    return direct;
  }
  return (
    registry.releases
      .filter((item) => item.channel === "dev" && item.acceptance_status === "pending")
      .sort((left, right) => right.created_at.localeCompare(left.created_at))[0] || null
  );
}

function setPendingDevRelease(releaseId) {
  const registry = readRegistry();
  registry.pending_dev_release_id = releaseId;
  writeRegistry(registry);
  return registry;
}

function clearPendingDevRelease() {
  const registry = readRegistry();
  registry.pending_dev_release_id = null;
  writeRegistry(registry);
  return registry;
}

function previewBaseUrl() {
  const host = process.env.AI_OS_LOCAL_PREVIEW_HOST || "127.0.0.1";
  const port = process.env.AI_OS_LOCAL_PREVIEW_PORT || "3001";
  return `http://${host}:${port}`;
}

function productionBaseUrl() {
  const host = process.env.AI_OS_LOCAL_PROD_HOST || process.env.AI_OS_LOCAL_HOST || "127.0.0.1";
  const port = process.env.AI_OS_LOCAL_PROD_PORT || process.env.AI_OS_LOCAL_PORT || "3000";
  return `http://${host}:${port}`;
}

function normalizeReleaseRecord(record) {
  const normalized = { ...record };
  normalized.primary_task_id = normalized.primary_task_id || null;
  normalized.linked_task_ids = Array.isArray(normalized.linked_task_ids) ? normalized.linked_task_ids : [];
  normalized.delivery_summary = normalized.delivery_summary || null;
  normalized.delivery_benefit = normalized.delivery_benefit || null;
  normalized.delivery_risks = normalized.delivery_risks || null;
  normalized.channel = normalized.channel === "dev" ? "dev" : "prod";
  normalized.acceptance_status =
    normalized.acceptance_status ||
    (normalized.channel === "dev" ? (normalized.status === "failed" ? "rejected" : "pending") : "accepted");
  normalized.preview_url = normalized.preview_url || (normalized.channel === "dev" ? previewBaseUrl() : null);
  normalized.promoted_to_main_at = normalized.promoted_to_main_at || null;
  normalized.promoted_from_dev_release_id = normalized.promoted_from_dev_release_id || null;
  return normalized;
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
  readTaskDeliveryMetadata,
  productionBaseUrl,
  readManifest,
  readRegistry,
  releaseIdFor,
  releaseReload,
  resolveCommit,
  run,
  runtimeRoot,
  setPendingDevRelease,
  updateChannelSymlink,
  upsertRelease,
  withReleaseLock,
  writeManifest,
  writeRegistry,
};
