import fs from "node:fs";
import path from "node:path";
import type { ReleaseDashboard, ReleaseRecord, ReleaseRegistry } from "./types";
import { getChannelBaseUrl, getLocalRuntimeStatus, getReleaseRuntimeRoot } from "./runtime";
import { normalizeDeliverySnapshot, resolveTaskContractSummary } from "./task-summary";

const EMPTY_REGISTRY: ReleaseRegistry = {
  active_release_id: null,
  pending_dev_release_id: null,
  updated_at: null,
  releases: []
};

export function readReleaseRegistry(): ReleaseRegistry {
  const registryPath = path.join(getReleaseRuntimeRoot(), "registry.json");
  if (!fs.existsSync(registryPath)) {
    return EMPTY_REGISTRY;
  }
  try {
    const payload = JSON.parse(fs.readFileSync(registryPath, "utf8")) as ReleaseRegistry;
    return {
      active_release_id: payload.active_release_id ?? null,
      pending_dev_release_id: payload.pending_dev_release_id ?? null,
      updated_at: payload.updated_at ?? null,
      releases: Array.isArray(payload.releases)
        ? payload.releases.map((release) => normalizeReleaseRecord(release))
        : []
    };
  } catch {
    return EMPTY_REGISTRY;
  }
}

export function getReleaseDashboard(): ReleaseDashboard {
  const registry = readReleaseRegistry();
  const releases = [...registry.releases].sort((left, right) =>
    (right.cutover_at || right.created_at).localeCompare(left.cutover_at || left.created_at)
  );
  return {
    runtime_root: getReleaseRuntimeRoot(),
    active_release_id: registry.active_release_id,
    active_release: releases.find((release) => release.release_id === registry.active_release_id) || null,
    pending_dev_release:
      releases.find((release) => release.release_id === registry.pending_dev_release_id) ||
      releases.find((release) => release.channel === "dev" && release.acceptance_status === "pending") ||
      null,
    dev_preview_url: getChannelBaseUrl("dev"),
    production_url: getChannelBaseUrl("prod"),
    releases,
    local_runtime: getLocalRuntimeStatus(),
    local_preview: getLocalRuntimeStatus("dev"),
  };
}

function normalizeReleaseRecord(release: ReleaseRecord): ReleaseRecord {
  const deliverySnapshot = normalizeDeliverySnapshot(
    (release as ReleaseRecord & { delivery_snapshot?: ReleaseRecord["delivery_snapshot"] }).delivery_snapshot,
    (release as ReleaseRecord & { delivery_summary?: string | null }).delivery_summary,
    (release as ReleaseRecord & { delivery_risks?: string | null }).delivery_risks
  );
  return {
    ...release,
    primary_task_id: release.primary_task_id ?? null,
    linked_task_ids: Array.isArray(release.linked_task_ids) ? release.linked_task_ids : [],
    delivery_snapshot: deliverySnapshot,
    resolved_task_contract: resolveTaskContractSummary(release.primary_task_id ?? null),
    channel: release.channel === "dev" ? "dev" : "prod",
    acceptance_status:
      release.acceptance_status || (release.status === "failed" ? "rejected" : release.channel === "dev" ? "pending" : "accepted"),
    preview_url: release.preview_url || (release.channel === "dev" ? getChannelBaseUrl("dev") : null),
    promoted_to_main_at: release.promoted_to_main_at ?? null,
    promoted_from_dev_release_id: release.promoted_from_dev_release_id ?? null,
  };
}
