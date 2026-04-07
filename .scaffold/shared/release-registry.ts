import { createRequire } from "node:module";
import type {
  ReleaseAcceptanceStatus,
  ReleaseChannel,
  ReleaseMachineTransitionRecord,
  ReleaseStateId,
} from "./release-state-machine.ts";

const require = createRequire(import.meta.url);

export type MinimalReleaseRecord = {
  release_id: string;
  state_id?: string | null;
  state_label?: string | null;
  last_transition?: ReleaseMachineTransitionRecord | null;
  blocked_reason?: string | null;
  channel?: ReleaseChannel | null;
  status?: string | null;
  acceptance_status?: string | null;
  promoted_to_main_at?: string | null;
  promoted_from_dev_release_id?: string | null;
  created_at?: string | null;
  cutover_at?: string | null;
};

export type MinimalReleaseRegistry<TRelease extends MinimalReleaseRecord = MinimalReleaseRecord> = {
  pending_dev_release_id?: string | null;
  releases?: TRelease[] | null;
};

type ReleaseStateMachineModule = {
  deriveReleaseAcceptanceStatus: (stateId: ReleaseStateId, channel: ReleaseChannel | null | undefined) => ReleaseAcceptanceStatus;
  deriveReleaseStatusFromStateId: (stateId: ReleaseStateId) => ReleaseStateId;
  getReleaseStateLabel: (stateId: ReleaseStateId, root?: string) => string;
  normalizeReleaseMachineState: (
    input: MinimalReleaseRecord | null | undefined,
    root?: string,
  ) => {
    state_id: ReleaseStateId;
    state_label: string;
    blocked_reason: string | null;
    last_transition: ReleaseMachineTransitionRecord | null;
  };
};

const FALLBACK_STATE_LABELS: Record<ReleaseStateId, string> = {
  prepared: "已准备",
  preview: "预览中",
  active: "当前版本",
  superseded: "已被替代",
  rejected: "已驳回",
  failed: "失败",
  rolled_back: "已回滚",
};

let releaseStateMachineModule: ReleaseStateMachineModule | null | undefined;

function loadReleaseStateMachineModule(): ReleaseStateMachineModule | null {
  if (releaseStateMachineModule !== undefined) {
    return releaseStateMachineModule;
  }
  try {
    releaseStateMachineModule = require("./release-state-machine.ts") as ReleaseStateMachineModule;
  } catch {
    releaseStateMachineModule = null;
  }
  return releaseStateMachineModule;
}

function normalizeReleaseStateId(value: string | null | undefined): ReleaseStateId | null {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (normalized === "prepared" || normalized === "preview" || normalized === "active" || normalized === "superseded" || normalized === "rejected" || normalized === "failed" || normalized === "rolled_back") {
    return normalized;
  }
  return null;
}

function deriveReleaseAcceptanceStatus(stateId: ReleaseStateId, channel: ReleaseChannel | null | undefined): ReleaseAcceptanceStatus {
  const module = loadReleaseStateMachineModule();
  if (module) {
    return module.deriveReleaseAcceptanceStatus(stateId, channel);
  }
  if (stateId === "rejected" || stateId === "failed") return "rejected";
  if (stateId === "preview") return "pending";
  if (stateId === "prepared") return channel === "dev" ? "pending" : "accepted";
  return "accepted";
}

function deriveReleaseStatusFromStateId(stateId: ReleaseStateId) {
  const module = loadReleaseStateMachineModule();
  if (module) {
    return module.deriveReleaseStatusFromStateId(stateId);
  }
  return stateId;
}

function getReleaseStateLabel(stateId: ReleaseStateId, root = process.cwd()) {
  const module = loadReleaseStateMachineModule();
  if (module) {
    return module.getReleaseStateLabel(stateId, root);
  }
  return FALLBACK_STATE_LABELS[stateId];
}

function normalizeReleaseMachineState(
  input: MinimalReleaseRecord | null | undefined,
  root = process.cwd(),
) {
  const module = loadReleaseStateMachineModule();
  if (module) {
    return module.normalizeReleaseMachineState(input, root);
  }
  const stateId = normalizeReleaseStateId(input?.state_id) || normalizeReleaseStateId(input?.status) || "prepared";
  const transition = input?.last_transition || null;
  return {
    state_id: stateId,
    state_label: FALLBACK_STATE_LABELS[stateId],
    blocked_reason: input?.blocked_reason || null,
    last_transition: transition
      ? {
          ...transition,
          event_id: transition.event_id,
          from_state_id: normalizeReleaseStateId(transition.from_state_id) || null,
          to_state_id: normalizeReleaseStateId(transition.to_state_id) || stateId,
        }
      : null,
  };
}

export function findPromotingProdRelease<TRelease extends MinimalReleaseRecord>(
  releases: readonly TRelease[],
  devReleaseId: string,
): TRelease | null {
  return (
    releases.find(
      (release) => release.channel === "prod" && String(release.promoted_from_dev_release_id || "").trim() === devReleaseId,
    ) || null
  );
}

export function isEffectivePendingDevRelease<TRelease extends MinimalReleaseRecord>(
  release: TRelease | null | undefined,
  releases: readonly TRelease[],
): release is TRelease {
  if (!release || release.channel !== "dev" || release.state_id !== "preview" || release.acceptance_status !== "pending") {
    return false;
  }
  if (release.promoted_to_main_at) {
    return false;
  }
  return !findPromotingProdRelease(releases, release.release_id);
}

export function normalizeReleaseRecord<TRelease extends MinimalReleaseRecord>(record: TRelease): TRelease {
  const normalizedState = normalizeReleaseMachineState(record);
  let stateId = normalizedState.state_id;
  const channel = record.channel === "dev" ? "dev" : "prod";
  if (!record.state_id && !record.status) {
    if (channel === "dev" && record.acceptance_status === "pending") {
      stateId = "preview";
    } else if (channel === "dev" && record.acceptance_status === "rejected") {
      stateId = "rejected";
    } else if (channel === "prod" && record.acceptance_status === "accepted") {
      stateId = "active";
    }
  }
  const acceptanceStatus = deriveReleaseAcceptanceStatus(stateId, channel);
  const derivedAcceptance = record.acceptance_status && record.acceptance_status === acceptanceStatus ? record.acceptance_status : acceptanceStatus;
  return {
    ...record,
    state_id: stateId,
    state_label: normalizedState.state_label,
    last_transition: normalizedState.last_transition,
    blocked_reason: normalizedState.blocked_reason,
    status: deriveReleaseStatusFromStateId(stateId),
    acceptance_status: derivedAcceptance,
    channel,
    promoted_to_main_at: record.promoted_to_main_at || null,
    promoted_from_dev_release_id: record.promoted_from_dev_release_id || null,
    created_at: record.created_at || null,
    cutover_at: record.cutover_at || null,
  };
}

export function findEffectivePendingDevRelease<TRelease extends MinimalReleaseRecord>(
  releases: readonly TRelease[],
  preferredReleaseId: string | null = null,
): TRelease | null {
  const candidates = releases
    .filter((release): release is TRelease => isEffectivePendingDevRelease(release, releases))
    .sort((left, right) => sortStamp(right).localeCompare(sortStamp(left)));

  if (preferredReleaseId) {
    const preferred = candidates.find((release) => release.release_id === preferredReleaseId);
    if (preferred) {
      return preferred;
    }
  }

  return candidates[0] || null;
}

export function reconcileReleaseRegistry<
  TRelease extends MinimalReleaseRecord,
  TRegistry extends MinimalReleaseRegistry<TRelease>,
>(registry: TRegistry): { registry: TRegistry; pendingDevRelease: TRelease | null; changed: boolean } {
  const releases = Array.isArray(registry.releases) ? registry.releases.map((release) => normalizeReleaseRecord(release)) : [];
  let changed = false;

  const reconciledReleases = releases.map((release) => {
    const promotingProd = findPromotingProdRelease(releases, release.release_id);
    const promotedAt =
      release.promoted_to_main_at || promotingProd?.promoted_to_main_at || promotingProd?.cutover_at || promotingProd?.created_at || null;

    if (release.channel !== "dev" || !promotedAt) {
      return release;
    }

    const nextStateId = (promotingProd ? "superseded" : release.state_id || "preview") as ReleaseStateId;
    const nextAcceptance = "accepted" as ReleaseAcceptanceStatus;
    if (nextAcceptance === release.acceptance_status && promotedAt === release.promoted_to_main_at && nextStateId === release.state_id) {
      return release;
    }

    changed = true;
    return {
      ...release,
      state_id: nextStateId,
      state_label: getReleaseStateLabel(nextStateId),
      status: nextStateId,
      acceptance_status: nextAcceptance,
      promoted_to_main_at: promotedAt,
    };
  });

  const pendingDevRelease = findEffectivePendingDevRelease(reconciledReleases, registry.pending_dev_release_id || null);
  const pendingDevReleaseId = pendingDevRelease?.release_id || null;
  if ((registry.pending_dev_release_id || null) !== pendingDevReleaseId) {
    changed = true;
  }

  return {
    registry: {
      ...registry,
      pending_dev_release_id: pendingDevReleaseId,
      releases: reconciledReleases,
    },
    pendingDevRelease,
    changed,
  };
}

function sortStamp(release: MinimalReleaseRecord) {
  return String(release.cutover_at || release.created_at || "");
}
