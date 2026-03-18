"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { executeReleaseAction, type ReleaseActionKind } from "@/modules/releases/action-client";
import { TASK_DELIVERY_LABELS } from "../delivery";
import type { TaskDeliveryRow, TaskDeliveryStatus } from "../types";

type Props = {
  rows: TaskDeliveryRow[];
  previewUrl: string;
  productionUrl: string;
};

const DELIVERY_TONE: Record<TaskDeliveryStatus, string> = {
  not_started: "border-sky-400/20 bg-sky-400/10 text-sky-100",
  in_progress: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  pending_acceptance: "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100",
  released: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  rolled_back: "border-white/12 bg-white/[0.05] text-white/78",
  blocked: "border-red-400/20 bg-red-400/10 text-red-100",
};

export function DeliveryTable({ rows, previewUrl, productionUrl }: Props) {
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
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/72">
          <span>交付状态</span>
          <select
            value={deliveryFilter}
            onChange={(event) => setDeliveryFilter(event.target.value as "all" | TaskDeliveryStatus)}
            className="bg-transparent text-white outline-none"
          >
            <option value="all">全部</option>
            <option value="pending_acceptance">待验收</option>
            <option value="in_progress">进行中</option>
            <option value="blocked">已阻塞</option>
            <option value="not_started">待开始</option>
            <option value="released">已发布</option>
            <option value="rolled_back">已回滚</option>
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/72">
          <input type="checkbox" checked={pendingOnly} onChange={(event) => setPendingOnly(event.target.checked)} />
          只看待验收
        </label>
        <span className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs text-white/62">
          当前显示 {filteredRows.length} 项
        </span>
        {message ? <p className="text-sm text-white/68">{message}</p> : null}
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-white/8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/8 text-left text-sm">
            <thead className="bg-white/[0.04] text-white/52">
              <tr>
                <HeadCell>任务</HeadCell>
                <HeadCell>收益</HeadCell>
                <HeadCell>风险</HeadCell>
                <HeadCell>状态</HeadCell>
                <HeadCell>版本</HeadCell>
                <HeadCell>复盘</HeadCell>
                <HeadCell>操作</HeadCell>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 bg-black/10">
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => {
                  const isExpanded = Boolean(expanded[row.id]);
                  return (
                    <Fragment key={row.id}>
                      <tr className="align-top">
                        <Cell className="min-w-[260px]">
                          <button
                            type="button"
                            className="space-y-1 text-left"
                            onClick={() => setExpanded((current) => ({ ...current, [row.id]: !current[row.id] }))}
                          >
                            <p className="font-medium text-white">{`${row.shortId || row.id} ${row.title}`.trim()}</p>
                            <p className="text-xs text-white/45">{row.path}</p>
                          </button>
                        </Cell>
                        <Cell className="min-w-[240px] text-white/76">
                          <div title={row.deliveryBenefit}>{truncate(row.deliveryBenefit || row.goal, 48)}</div>
                        </Cell>
                        <Cell className="min-w-[220px] text-white/68">
                          <div title={row.deliveryRisk}>{truncate(row.deliveryRisk || "未记录", 40)}</div>
                        </Cell>
                        <Cell className="min-w-[140px]">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${DELIVERY_TONE[row.deliveryStatus]}`}>
                            {TASK_DELIVERY_LABELS[row.deliveryStatus]}
                          </span>
                        </Cell>
                        <Cell className="min-w-[200px] text-white/76">
                          <div className="space-y-1">
                            <p>{row.versionLabel}</p>
                            {row.linkedTaskIds.length > 0 ? (
                              <p className="text-xs text-white/45">关联 task：{row.linkedTaskIds.join(", ")}</p>
                            ) : null}
                          </div>
                        </Cell>
                        <Cell className="min-w-[200px] text-white/68">
                          <div title={row.deliveryRetro}>{truncate(row.deliveryRetro || "未复盘", 40)}</div>
                        </Cell>
                        <Cell className="min-w-[230px]">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/knowledge-base?path=${encodeURIComponent(row.path)}`}
                              className="inline-flex rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-xs text-accent transition hover:bg-accent/18"
                            >
                              打开
                            </Link>
                            {row.acceptReleaseId ? (
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() =>
                                  runAction("accept-dev", "/api/releases/dev/accept", { releaseId: row.acceptReleaseId as string })
                                }
                                className="inline-flex rounded-full border border-emerald-400/35 bg-emerald-400/12 px-3 py-1 text-xs text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                验收通过
                              </button>
                            ) : null}
                            {row.rollbackReleaseId ? (
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() =>
                                  runAction("rollback-prod", "/api/releases/rollback", { releaseId: row.rollbackReleaseId as string })
                                }
                                className="inline-flex rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-xs text-white/78 transition hover:border-accent/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                回滚版本
                              </button>
                            ) : null}
                          </div>
                        </Cell>
                      </tr>
                      {isExpanded ? (
                        <tr>
                          <td colSpan={7} className="bg-white/[0.03] px-4 py-4">
                            <div className="grid gap-4 lg:grid-cols-3 text-sm text-white/68">
                              <DetailBlock title="工程明细">
                                <p>当前模式：{row.currentMode || "未标注"}</p>
                                <p>分支：{row.branch || "未绑定"}</p>
                                <p>最近提交：{row.git.recentCommit || row.recentCommit || "pending"}</p>
                                <p>Git 状态：{row.git.detail}</p>
                              </DetailBlock>
                              <DetailBlock title="关联模块">
                                {row.relatedModules.length > 0 ? row.relatedModules.map((item) => <p key={item}>{item}</p>) : <p>无</p>}
                              </DetailBlock>
                              <DetailBlock title="更新痕迹">
                                <p>记忆：{row.updateTrace.memory}</p>
                                <p>索引：{row.updateTrace.index}</p>
                                <p>路线图：{row.updateTrace.roadmap}</p>
                                <p>文档：{row.updateTrace.docs}</p>
                              </DetailBlock>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-5 text-white/58">
                    当前筛选条件下没有任务。
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

function Cell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-4 ${className ?? ""}`}>{children}</td>;
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-accent">{title}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
}
