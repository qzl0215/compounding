const fs = require("node:fs");
const path = require("node:path");
const { ensureLayout, previewBaseUrl } = require("./runtime-layout.ts");
const { findEffectivePendingDevRelease, reconcileReleaseRegistry } = require("../../shared/release-registry.ts");

function emptyRegistry() {
  return { active_release_id: null, pending_dev_release_id: null, updated_at: null, releases: [] };
}

function normalizeDeliverySnapshot(snapshot, summary = null, risks = null) {
  const normalized = {
    summary: snapshot?.summary || summary || null,
    risk: snapshot?.risk || risks || null,
    done_when: snapshot?.done_when || null,
  };
  if (!normalized.summary && !normalized.risk && !normalized.done_when) {
    return null;
  }
  return normalized;
}

function normalizeReleaseRecord(record) {
  const normalized = { ...record };
  normalized.primary_task_id = normalized.primary_task_id || null;
  normalized.linked_task_ids = Array.isArray(normalized.linked_task_ids) ? normalized.linked_task_ids : [];
  normalized.delivery_snapshot = normalizeDeliverySnapshot(
    normalized.delivery_snapshot,
    normalized.delivery_summary,
    normalized.delivery_risks
  );
  delete normalized.delivery_summary;
  delete normalized.delivery_benefit;
  delete normalized.delivery_risks;
  normalized.channel = normalized.channel === "dev" ? "dev" : "prod";
  normalized.acceptance_status =
    normalized.acceptance_status ||
    (normalized.channel === "dev" ? (normalized.status === "failed" ? "rejected" : "pending") : "accepted");
  normalized.preview_url = normalized.preview_url || (normalized.channel === "dev" ? previewBaseUrl() : null);
  normalized.promoted_to_main_at = normalized.promoted_to_main_at || null;
  normalized.promoted_from_dev_release_id = normalized.promoted_from_dev_release_id || null;
  return normalized;
}

function parseRegistryPayload(raw = {}) {
  return {
    active_release_id: raw.active_release_id ?? null,
    pending_dev_release_id: raw.pending_dev_release_id ?? null,
    updated_at: raw.updated_at ?? null,
    releases: Array.isArray(raw.releases) ? raw.releases.map(normalizeReleaseRecord) : [],
  };
}

function readRegistryState() {
  const { registryPath } = ensureLayout();
  if (!fs.existsSync(registryPath)) {
    return { registry: emptyRegistry(), changed: false };
  }
  try {
    return reconcileReleaseRegistry(parseRegistryPayload(JSON.parse(fs.readFileSync(registryPath, "utf8"))));
  } catch {
    return { registry: emptyRegistry(), changed: false };
  }
}

function readRegistry() {
  return readRegistryState().registry;
}

function writeRegistry(registry, options = {}) {
  const { registryPath } = ensureLayout();
  const next = options.skip_reconcile ? registry : reconcileReleaseRegistry(registry).registry;
  next.updated_at = new Date().toISOString();
  fs.writeFileSync(registryPath, JSON.stringify(next, null, 2) + "\n");
  if (options.sync_manifests) {
    next.releases.forEach((record) => writeManifest(record));
  }
  return next;
}

function repairRegistry() {
  const { registry, changed } = readRegistryState();
  if (changed) {
    return writeRegistry(registry, { skip_reconcile: true, sync_manifests: true });
  }
  return registry;
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

function upsertRelease(record) {
  const registry = readRegistry();
  const normalizedRecord = normalizeReleaseRecord(record);
  const existingIndex = registry.releases.findIndex((item) => item.release_id === normalizedRecord.release_id);
  if (existingIndex >= 0) {
    registry.releases[existingIndex] = normalizedRecord;
  } else {
    registry.releases.push(normalizedRecord);
  }
  return writeRegistry(registry, { sync_manifests: true });
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
  return writeRegistry(registry, { sync_manifests: true });
}

function currentActiveRelease(registry = readRegistry()) {
  return registry.releases.find((item) => item.release_id === registry.active_release_id) || null;
}

function pendingDevRelease(registry = readRegistry()) {
  return findEffectivePendingDevRelease(registry.releases, registry.pending_dev_release_id || null);
}

function setPendingDevRelease(releaseId) {
  const registry = readRegistry();
  registry.pending_dev_release_id = releaseId;
  return writeRegistry(registry, { sync_manifests: true });
}

function clearPendingDevRelease() {
  const registry = readRegistry();
  registry.pending_dev_release_id = null;
  return writeRegistry(registry, { sync_manifests: true });
}

module.exports = {
  clearPendingDevRelease,
  currentActiveRelease,
  emptyRegistry,
  manifestPath,
  markActive,
  normalizeReleaseRecord,
  pendingDevRelease,
  repairRegistry,
  readManifest,
  readRegistry,
  setPendingDevRelease,
  upsertRelease,
  writeManifest,
  writeRegistry,
};
