"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { LocalRuntimeStatus, ReleaseRecord, ReleaseTaskOption } from "../types";
import { executeReleaseAction, type ReleaseActionKind } from "../action-client";
import { ReleaseControlBar, ReleaseSummaryGrid } from "./release-dashboard-controls";
import { ReleaseHistoryList } from "./release-dashboard-history";

type Props = {
  releases: ReleaseRecord[];
  activeReleaseId: string | null;
  pendingDevRelease: ReleaseRecord | null;
  previewUrl: string;
  productionUrl: string;
  runtimeStatus: LocalRuntimeStatus;
  taskOptions: ReleaseTaskOption[];
};

export function ReleaseDashboardPanel({
  releases,
  activeReleaseId,
  pendingDevRelease,
  previewUrl,
  productionUrl,
  runtimeStatus,
  taskOptions,
}: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [primaryTaskId, setPrimaryTaskId] = useState(taskOptions[0]?.id || "");
  const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>([]);

  const runAction = (kind: ReleaseActionKind, url: string, payload: Record<string, unknown>) => {
    startTransition(async () => {
      try {
        setMessage("正在执行，请稍候…");
        const result = await executeReleaseAction({
          kind,
          url,
          payload,
          previewUrl,
          productionUrl,
        });
        setMessage(result.message);
        if (!result.ok) {
          return;
        }
        const redirectTarget = result.redirectTarget;
        if (redirectTarget && typeof window !== "undefined") {
          window.location.assign(redirectTarget);
          return;
        }
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "执行失败，请稍后重试。");
      }
    });
  };

  const createDevPayload = {
    ref: "HEAD",
    primaryTaskId,
    linkedTaskIds,
  };

  return (
    <div className="space-y-4">
      <ReleaseControlBar
        pending={pending}
        message={message}
        pendingDevRelease={pendingDevRelease}
        runtimeStatus={runtimeStatus}
        taskOptions={taskOptions}
        primaryTaskId={primaryTaskId}
        linkedTaskIds={linkedTaskIds}
        onPrimaryTaskChange={setPrimaryTaskId}
        onLinkedTaskIdsChange={setLinkedTaskIds}
        onCreateDev={() => runAction("create-dev", "/api/releases/dev", createDevPayload)}
        onAcceptDev={() => runAction("accept-dev", "/api/releases/dev/accept", { releaseId: pendingDevRelease?.release_id })}
        onRejectDev={() => runAction("reject-dev", "/api/releases/dev/reject", { releaseId: pendingDevRelease?.release_id })}
      />
      <ReleaseSummaryGrid
        pendingDevRelease={pendingDevRelease}
        activeReleaseId={activeReleaseId}
        previewUrl={previewUrl}
        productionUrl={productionUrl}
      />
      <ReleaseHistoryList
        releases={releases}
        activeReleaseId={activeReleaseId}
        pendingDevRelease={pendingDevRelease}
        pending={pending}
        onRollback={(releaseId) => runAction("rollback-prod", "/api/releases/rollback", { releaseId })}
      />
    </div>
  );
}
