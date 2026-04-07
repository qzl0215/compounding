import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { HarnessLiveSnapshot } from "../types";

type HarnessBoardProps = {
  snapshot: HarnessLiveSnapshot;
  compact?: boolean;
};

export function HarnessBoard({ snapshot, compact = false }: HarnessBoardProps) {
  const workflowTone =
    snapshot.state.workflow.state_id === "blocked"
      ? "danger"
      : ["executing", "review_pending", "reviewing", "release_preparing", "acceptance_pending"].includes(snapshot.state.workflow.state_id)
        ? "warning"
        : snapshot.state.workflow.state_id === "released"
          ? "success"
          : "accent";
  const hygieneTone = snapshot.state.hygiene.blockers.length > 0 ? "danger" : "success";
  const runtimeTone = snapshot.state.runtime_alignment.aligned ? "success" : "warning";

  return (
    <Card className={compact ? "p-5" : "p-6 lg:p-8"}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-sky-700">控制平面</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">
              {snapshot.active_contract ? `${snapshot.active_contract.short_id} ${snapshot.active_contract.title}` : "当前没有 active contract"}
            </h2>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-700">
              {snapshot.active_intent
                ? `${snapshot.active_intent.summary}。${snapshot.active_intent.why_now}`
                : "当前还没有可执行合同，先把用户意图收成正式执行合同。"}
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              {snapshot.next_action
                ? `下一步唯一合法动作：${snapshot.next_action.label}。${snapshot.next_action.reason}`
                : "当前没有待执行动作。"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={workflowTone}>{snapshot.state.workflow.state_label}</Badge>
            <Badge tone={hygieneTone}>{snapshot.state.hygiene.blockers.length > 0 ? "卫生阻塞" : "卫生通过"}</Badge>
            <Badge tone={runtimeTone}>{snapshot.state.runtime_alignment.aligned ? "运行对齐" : "运行待对齐"}</Badge>
          </div>
        </div>

        <div className={`grid gap-4 ${compact ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}>
          <Metric title="当前阶段" value={snapshot.state.workflow.state_label} detail={snapshot.state.workflow.mode_label || "无"} />
          <Metric
            title="下一步动作"
            value={snapshot.next_action?.label || "无"}
            detail={snapshot.next_action?.command || snapshot.current_executor.reason}
          />
          <Metric
            title="目标版本"
            value={snapshot.state.runtime_alignment.target_release_id || "当前无目标版本"}
            detail={snapshot.state.runtime_alignment.reason}
          />
          {!compact ? (
            <Metric
              title="当前执行者"
              value={snapshot.current_executor.role}
              detail={snapshot.current_executor.reason}
            />
          ) : null}
        </div>

        <div className={`grid gap-4 ${compact ? "xl:grid-cols-2" : "xl:grid-cols-3"}`}>
          <DetailCard
            title="执行卫生"
            lines={
              snapshot.state.hygiene.blockers.length > 0
                ? snapshot.state.hygiene.blockers
                : ["当前 worktree、upstream 与锁状态没有阻塞。", ...snapshot.state.hygiene.notes.slice(0, 2)]
            }
          />
          <DetailCard
            title="运行态对齐"
            lines={[
              `target: ${snapshot.state.runtime_alignment.target_release_id || "none"}`,
              `observed: ${snapshot.state.runtime_alignment.observed_release_id || "none"}`,
              snapshot.state.runtime_alignment.reason,
            ]}
          />
          <DetailCard
            title="兼容投影"
            lines={[
              `active release: ${snapshot.compatibility.active_release_id || "none"}`,
              `pending dev: ${snapshot.compatibility.pending_dev_release_id || "none"}`,
              `tasks in progress: ${snapshot.compatibility.active_task_count}，blocked: ${snapshot.compatibility.blocked_task_count}`,
            ]}
          />
        </div>
      </div>
    </Card>
  );
}

function Metric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded-[1.45rem] border border-slate-200 bg-white/90 px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{title}</p>
      <p className="mt-3 break-words text-sm font-medium leading-7 text-slate-900">{value}</p>
      <p className="mt-2 text-xs leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function DetailCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white/90 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-sky-700">{title}</p>
      <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
        {lines.filter(Boolean).map((line, index) => (
          <p key={`${title}-${index}`}>{line}</p>
        ))}
      </div>
    </div>
  );
}
