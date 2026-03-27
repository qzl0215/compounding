import type { ReleaseRecord } from "../types";
import { resolveReleaseContractSummary } from "../release-summary";
import { formatTaskCostCodeDelta, formatTaskCostDuration, summarizeTaskCostEffect } from "../../../../../../shared/task-cost";
import { formatEstimatedTokens } from "../../../../../../shared/token-format";

type HistoryProps = {
  releases: ReleaseRecord[];
  activeReleaseId: string | null;
  pendingDevRelease: ReleaseRecord | null;
  pending: boolean;
  onRollback(releaseId: string): void;
};

export function ReleaseHistoryList({
  releases,
  activeReleaseId,
  pendingDevRelease,
  pending,
  onRollback,
}: HistoryProps) {
  return (
    <div className="space-y-4">
      {releases.map((release) => {
        const isActive = release.release_id === activeReleaseId;
        const isPendingDev = pendingDevRelease?.release_id === release.release_id;
        const contractSummary = resolveReleaseContractSummary(release);
        const changeCost = release.delivery_snapshot?.change_cost || null;
        return (
          <article key={release.release_id} className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">{release.release_id}</h3>
                  <StatusBadge label={isActive ? "当前生产版本" : isPendingDev ? "待验收 dev" : formatReleaseStatus(release.status)} />
                  <StatusBadge label={release.channel === "dev" ? "dev" : "prod"} />
                </div>
                <p className="mt-2 font-mono text-xs text-slate-500">{release.commit_sha}</p>
              </div>
              {release.channel === "prod" ? (
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-sky-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={pending || isActive}
                  onClick={() => onRollback(release.release_id)}
                >
                  回滚到此版本
                </button>
              ) : null}
            </div>

            <dl className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-4">
              <Meta title="通道" value={release.channel === "dev" ? "dev 预览" : "production"} />
              <Meta title="来源分支" value={release.source_ref} />
              <Meta title="主 task" value={release.primary_task_id || "未绑定"} />
              <Meta title="构建结果" value={release.build_result} />
              <Meta title="验收状态" value={formatAcceptance(release.acceptance_status)} />
              <Meta title="切换时间" value={release.cutover_at || release.promoted_to_main_at || "未切换"} />
            </dl>

            {contractSummary.summary || contractSummary.doneWhen || contractSummary.risk ? (
              <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
                <Meta title="交付摘要" value={contractSummary.summary || "未记录"} />
                <Meta title="完成定义" value={contractSummary.doneWhen || "未记录"} />
                <Meta title="交付风险" value={contractSummary.risk || "未记录"} />
              </div>
            ) : null}

            {changeCost ? (
              <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-4">
                <Meta
                  title="时间成本"
                  value={`active ${formatTaskCostDuration(changeCost.time.active_ms)} / wait ${formatTaskCostDuration(changeCost.time.wait_ms)}${
                    changeCost.time.dominant_stage ? ` / ${changeCost.time.dominant_stage}` : ""
                  }`}
                />
                <Meta
                  title="Token 成本"
                  value={`输入 ~${formatEstimatedTokens(changeCost.tokens.summary_input_est + changeCost.tokens.context_input_est)} / 节省 ~${formatEstimatedTokens(
                    changeCost.tokens.summary_saved_est + changeCost.tokens.context_saved_est,
                  )}`}
                />
                <Meta title="代码量" value={formatTaskCostCodeDelta(changeCost.code)} />
                <Meta title="效果" value={summarizeTaskCostEffect(changeCost.effect)} />
              </div>
            ) : null}

            {release.linked_task_ids.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.24em] text-sky-700">辅助 task</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {release.linked_task_ids.map((taskId) => (
                    <span key={taskId} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                      {taskId}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {release.change_summary.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.24em] text-sky-700">近期改动</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {release.change_summary.map((item) => (
                    <li key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {release.notes.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.24em] text-sky-700">发布备注</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {release.notes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function Meta({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-slate-200 bg-white/90 px-3 py-3">
      <dt className="text-xs uppercase tracking-[0.22em] text-slate-500">{title}</dt>
      <dd className="mt-2 text-slate-900">{value}</dd>
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  return <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">{label}</span>;
}

function formatReleaseStatus(status: ReleaseRecord["status"]) {
  const labels: Record<ReleaseRecord["status"], string> = {
    prepared: "已准备",
    preview: "预览中",
    active: "当前版本",
    superseded: "已被替代",
    failed: "失败",
    rolled_back: "已回滚",
    rejected: "已驳回",
  };
  return labels[status];
}

function formatAcceptance(status: ReleaseRecord["acceptance_status"]) {
  const labels: Record<ReleaseRecord["acceptance_status"], string> = {
    pending: "待验收",
    accepted: "已通过",
    rejected: "已驳回",
  };
  return labels[status];
}
