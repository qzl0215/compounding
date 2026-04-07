import type { ReleaseRecord } from "./types";

export function resolveReleaseContractSummary(release: Pick<ReleaseRecord, "delivery_snapshot" | "resolved_task_contract">) {
  return {
    summary: release.resolved_task_contract?.summary || release.delivery_snapshot?.summary || null,
    risk: release.resolved_task_contract?.risk || release.delivery_snapshot?.risk || null,
    doneWhen: release.resolved_task_contract?.done_when || release.delivery_snapshot?.done_when || null,
  };
}
