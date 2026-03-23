"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { DEMAND_STAGE_LABELS, resolveTaskDemandStage } from "@/modules/portal/stage-model";
import { TASK_DELIVERY_LABELS } from "../delivery";
import type { TaskDeliveryRow, TaskDeliveryStatus } from "../types";

const DELIVERY_TONE: Record<TaskDeliveryStatus, string> = {
  not_started: "border-sky-400/20 bg-sky-400/10 text-sky-100",
  in_progress: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  pending_acceptance: "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100",
  released: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  rolled_back: "border-white/12 bg-white/[0.05] text-white/78",
  blocked: "border-red-400/20 bg-red-400/10 text-red-100",
};

const STAGE_TONE: Record<string, string> = {
  planning: "border-sky-400/20 bg-sky-400/10 text-sky-100",
  ready: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  doing: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  acceptance: "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100",
  released: "border-white/12 bg-white/[0.05] text-white/78",
};

type Props = {
  row: TaskDeliveryRow;
  isExpanded: boolean;
  pending: boolean;
  onToggle(): void;
  onAccept(releaseId: string): void;
  onRollback(releaseId: string): void;
};

export function DeliveryTableRow({ row, isExpanded, pending, onToggle, onAccept, onRollback }: Props) {
  const stage = resolveTaskDemandStage(row);

  return (
    <Fragment>
      <tr className="align-top">
        <Cell className="min-w-[260px]">
          <button type="button" className="space-y-1 text-left" onClick={onToggle}>
            <p className="font-medium text-white">{`${row.shortId || row.id} ${row.title}`.trim()}</p>
            <p className="text-xs text-white/45" title={row.whyNow}>
              {truncate(row.whyNow || "未记录", 52)}
            </p>
          </button>
        </Cell>
        <Cell className="min-w-[140px]">
          <div className="space-y-2">
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${STAGE_TONE[stage] || STAGE_TONE.ready}`}>
              {DEMAND_STAGE_LABELS[stage]}
            </span>
            {row.currentMode ? <p className="text-xs text-white/45">{row.currentMode}</p> : null}
          </div>
        </Cell>
        <Cell className="min-w-[260px] text-white/72">
          <div title={row.doneWhen}>{truncate(row.doneWhen || "未记录", 52)}</div>
        </Cell>
        <Cell className="min-w-[140px]">
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${DELIVERY_TONE[row.deliveryStatus]}`}>
            {TASK_DELIVERY_LABELS[row.deliveryStatus]}
          </span>
        </Cell>
        <Cell className="min-w-[220px] text-white/68">
          <div title={row.risk}>{truncate(row.risk || "未记录", 40)}</div>
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
                onClick={() => onAccept(row.acceptReleaseId as string)}
                className="inline-flex rounded-full border border-emerald-400/35 bg-emerald-400/12 px-3 py-1 text-xs text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                验收通过
              </button>
            ) : null}
            {row.rollbackReleaseId ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => onRollback(row.rollbackReleaseId as string)}
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
          <td colSpan={6} className="bg-white/[0.03] px-4 py-4">
            <div className="grid gap-4 text-sm text-white/68 lg:grid-cols-3">
              <DetailBlock title="任务摘要">
                <p>为什么现在：{row.whyNow || "未记录"}</p>
                <p>父计划：{row.parentPlan || "未标注"}</p>
                <p>承接边界：{row.boundary || "未记录"}</p>
                <p>完成定义：{row.doneWhen || "未记录"}</p>
              </DetailBlock>
              <DetailBlock title="执行合同">
                <p className="whitespace-pre-line">要做：{row.inScope || "未记录"}</p>
                <p className="whitespace-pre-line">不做：{row.outOfScope || "未记录"}</p>
                <p className="whitespace-pre-line">约束：{row.constraints || "未记录"}</p>
                <p className="whitespace-pre-line">测试策略：{row.testStrategy || "未记录"}</p>
              </DetailBlock>
              <DetailBlock title="交付结果">
                <p>体验验收结果：{row.acceptanceResult || "待验收"}</p>
                <p>交付结果：{row.deliveryResult || "未记录"}</p>
                <p>复盘：{row.retro || "未复盘"}</p>
                <p>版本：{row.versionLabel}</p>
                {row.linkedTaskIds.length > 0 ? <p>关联 task：{row.linkedTaskIds.join(", ")}</p> : null}
              </DetailBlock>
              <DetailBlock title="机器事实">
                <p>任务路径：{row.path}</p>
                <p>当前模式：{row.currentMode || "未标注"}</p>
                <p>完成策略：{row.machine.completionMode === "close_full_contract" ? "做透当前合同" : row.machine.completionMode || "未标注"}</p>
                <p>搜索结论：{row.machine.latestSearchEvidence || "未记录"}</p>
                <p>合同哈希：{row.machine.contractHash || "未生成"}</p>
                <p>分支：{row.machine.branch || "未绑定"}</p>
                <p>最近提交：{row.machine.git.recentCommit || row.machine.recentCommit || "pending"}</p>
                <p>Git 状态：{row.machine.git.detail}</p>
                <p>主发布版本：{row.machine.primaryRelease || "未生成"}</p>
                <p>锁：{row.machine.locks.length > 0 ? row.machine.locks.join("，") : "无锁冲突"}</p>
                <p>执行产物：{row.machine.artifactRefs.length > 0 ? row.machine.artifactRefs.join("，") : "无"}</p>
              </DetailBlock>
              <DetailBlock title="模块与痕迹">
                {row.machine.relatedModules.length > 0 ? row.machine.relatedModules.map((item) => <p key={item}>{item}</p>) : <p>无关联模块</p>}
                <p>记忆：{row.machine.updateTrace.memory}</p>
                <p>索引：{row.machine.updateTrace.index}</p>
                <p>路线图：{row.machine.updateTrace.roadmap}</p>
                <p>文档：{row.machine.updateTrace.docs}</p>
              </DetailBlock>
            </div>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
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
  const safe = value || "";
  if (safe.length <= maxLength) {
    return safe;
  }
  return `${safe.slice(0, maxLength - 1)}…`;
}
