"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { DEMAND_STAGE_LABELS, resolveTaskDemandStage } from "@/modules/portal/stage-model";
import { formatEstimatedTokens } from "../../../../../../shared/ai-efficiency";
import { formatBranchCleanupStateLabel } from "../../../../../../shared/branch-cleanup";
import { formatTaskCostCodeDelta, formatTaskCostDuration, summarizeTaskCostEffect } from "../../../../../../shared/task-cost";
import { TASK_DELIVERY_LABELS } from "../delivery";
import type { TaskDeliveryRow, TaskDeliveryStatus } from "../types";

const DELIVERY_TONE: Record<TaskDeliveryStatus, string> = {
  not_started: "border-sky-200 bg-sky-50 text-sky-700",
  in_progress: "border-amber-200 bg-amber-50 text-amber-700",
  pending_acceptance: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  released: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rolled_back: "border-slate-200 bg-slate-50 text-slate-700",
  blocked: "border-rose-200 bg-rose-50 text-rose-700",
};

const STAGE_TONE: Record<string, string> = {
  planning: "border-sky-200 bg-sky-50 text-sky-700",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  doing: "border-amber-200 bg-amber-50 text-amber-700",
  acceptance: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  released: "border-slate-200 bg-slate-50 text-slate-700",
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
      <tr className="align-top transition hover:bg-slate-50">
        <Cell className="min-w-[260px]">
          <button type="button" className="space-y-1 text-left" onClick={onToggle}>
            <p className="font-medium leading-6 text-slate-900">{`${row.shortId || row.id} ${row.title}`.trim()}</p>
            <p className="text-xs text-slate-500" title={row.whyNow}>
              {truncate(row.whyNow || "未记录", 52)}
            </p>
          </button>
        </Cell>
        <Cell className="min-w-[140px]">
          <div className="space-y-2">
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${STAGE_TONE[stage] || STAGE_TONE.ready}`}>
              {DEMAND_STAGE_LABELS[stage]}
            </span>
            {row.currentMode ? <p className="text-xs text-slate-500">{row.currentMode}</p> : null}
          </div>
        </Cell>
        <Cell className="min-w-[260px] text-slate-700">
          <div title={row.doneWhen}>{truncate(row.doneWhen || "未记录", 52)}</div>
        </Cell>
        <Cell className="min-w-[140px]">
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${DELIVERY_TONE[row.deliveryStatus]}`}>
            {TASK_DELIVERY_LABELS[row.deliveryStatus]}
          </span>
        </Cell>
        <Cell className="min-w-[220px] text-slate-600">
          <div title={row.risk}>{truncate(row.risk || "未记录", 40)}</div>
        </Cell>
        <Cell className="min-w-[230px]">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/knowledge-base?path=${encodeURIComponent(row.path)}`}
              className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs text-sky-700 transition hover:bg-sky-100"
            >
              打开
            </Link>
            {row.acceptReleaseId ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => onAccept(row.acceptReleaseId as string)}
                className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                验收通过
              </button>
            ) : null}
            {row.rollbackReleaseId ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => onRollback(row.rollbackReleaseId as string)}
                className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 transition hover:border-sky-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                回滚版本
              </button>
            ) : null}
          </div>
        </Cell>
      </tr>
      {isExpanded ? (
        <tr>
          <td colSpan={6} className="bg-slate-50 px-4 py-4">
            <div className="grid gap-4 text-sm text-slate-700 lg:grid-cols-3">
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
              <DetailBlock title="成本账单">
                <p>
                  时间：active {formatTaskCostDuration(row.cost.time.active_ms)} / wait {formatTaskCostDuration(row.cost.time.wait_ms)}
                  {row.cost.time.dominant_stage ? ` / dominant ${row.cost.time.dominant_stage}` : ""}
                </p>
                <p>
                  Token：summary ~{formatEstimatedTokens(row.cost.tokens.summary_input_est)}，context ~
                  {formatEstimatedTokens(row.cost.tokens.context_input_est)}，累计节省 ~
                  {formatEstimatedTokens(row.cost.tokens.summary_saved_est + row.cost.tokens.context_saved_est)}
                </p>
                <p>代码量：{formatTaskCostCodeDelta(row.cost.code)}{row.cost.code.source !== "none" ? ` (${row.cost.code.source})` : ""}</p>
                <p>效果：{summarizeTaskCostEffect(row.cost.effect)}</p>
                {row.cost.effect.last_gate_failures.length > 0 ? <p>最近失败：{row.cost.effect.last_gate_failures.join("；")}</p> : null}
              </DetailBlock>
              <DetailBlock title="分支回收">
                <p>状态：{row.machine.branchCleanup ? row.machine.branchCleanup.summary : "尚未建立分支回收记录。"}</p>
                <p>本地：{formatBranchCleanupStateLabel(row.machine.branchCleanup?.localState || "none")}</p>
                <p>远端：{formatBranchCleanupStateLabel(row.machine.branchCleanup?.remoteState || "none")}</p>
                <p>触发：{row.machine.branchCleanup?.trigger === "legacy_merged" ? "历史补账" : row.machine.branchCleanup ? "Prod 验收成功" : "未记录"}</p>
                <p>计划时间：{row.machine.branchCleanup?.scheduledFor || "未计划"}</p>
                {row.machine.branchCleanup?.sourceReleaseId ? <p>来源 release：{row.machine.branchCleanup.sourceReleaseId}</p> : null}
                {row.machine.branchCleanup?.lastError ? <p>失败原因：{row.machine.branchCleanup.lastError}</p> : null}
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
    <div className="rounded-[1.35rem] border border-slate-200 bg-white/90 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-sky-700">{title}</p>
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
