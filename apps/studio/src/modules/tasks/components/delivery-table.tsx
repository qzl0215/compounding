"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { executeReleaseAction, type ReleaseActionKind } from "@/modules/releases/action-client";
import type { TaskDeliveryRow, TaskDeliveryStatus } from "../types";
import { DeliveryTableControls } from "./delivery-table-controls";
import { DeliveryTableRow } from "./delivery-table-row";

type Props = {
  rows: TaskDeliveryRow[];
  previewUrl: string;
  productionUrl: string;
  showControls?: boolean;
  emptyText?: string;
};

export function DeliveryTable({
  rows,
  previewUrl,
  productionUrl,
  showControls = true,
  emptyText = "当前筛选条件下没有任务。",
}: Props) {
  const router = useRouter();
  const [deliveryFilter, setDeliveryFilter] = useState<"all" | TaskDeliveryStatus>("all");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (deliveryFilter !== "all" && row.deliveryStatus !== deliveryFilter) {
        return false;
      }
      if (pendingOnly && !row.acceptReleaseId) {
        return false;
      }
      return true;
    });
  }, [deliveryFilter, pendingOnly, rows]);

  const runAction = (kind: ReleaseActionKind, url: string, payload: Record<string, string>) => {
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

  return (
    <div className="space-y-4">
      {showControls ? (
        <DeliveryTableControls
          deliveryFilter={deliveryFilter}
          pendingOnly={pendingOnly}
          filteredCount={filteredRows.length}
          message={message}
          onDeliveryFilterChange={setDeliveryFilter}
          onPendingOnlyChange={setPendingOnly}
        />
      ) : message ? (
        <p className="text-sm text-white/68">{message}</p>
      ) : null}

      <div className="overflow-hidden rounded-[1.75rem] border border-white/8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/8 text-left text-sm">
            <thead className="bg-white/[0.04] text-white/52">
              <tr>
                <HeadCell>子任务</HeadCell>
                <HeadCell>阶段</HeadCell>
                <HeadCell>完成定义</HeadCell>
                <HeadCell>状态</HeadCell>
                <HeadCell>关键风险</HeadCell>
                <HeadCell>操作</HeadCell>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 bg-black/10">
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => {
                  const isExpanded = Boolean(expanded[row.id]);
                  return (
                    <DeliveryTableRow
                      key={row.id}
                      row={row}
                      isExpanded={isExpanded}
                      pending={pending}
                      onToggle={() => setExpanded((current) => ({ ...current, [row.id]: !current[row.id] }))}
                      onAccept={(releaseId) => runAction("accept-dev", "/api/releases/dev/accept", { releaseId })}
                      onRollback={(releaseId) => runAction("rollback-prod", "/api/releases/rollback", { releaseId })}
                    />
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-5 text-white/58">
                    {emptyText}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HeadCell({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}
