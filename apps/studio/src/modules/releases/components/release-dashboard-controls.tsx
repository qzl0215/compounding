import { getRuntimeStatusExplanation } from "../runtime-status";
import { resolveReleaseContractSummary } from "../release-summary";
import type { LocalRuntimeStatus, ReleaseRecord, ReleaseTaskOption } from "../types";

type ControlBarProps = {
  pending: boolean;
  message: string | null;
  pendingDevRelease: ReleaseRecord | null;
  runtimeStatus: LocalRuntimeStatus;
  taskOptions: ReleaseTaskOption[];
  primaryTaskId: string;
  linkedTaskIds: string[];
  onPrimaryTaskChange(value: string): void;
  onLinkedTaskIdsChange(values: string[]): void;
  onCreateDev(): void;
  onAcceptDev(): void;
  onRejectDev(): void;
};

type SummaryProps = {
  pendingDevRelease: ReleaseRecord | null;
  activeReleaseId: string | null;
  previewUrl: string;
  productionUrl: string;
};

export function ReleaseControlBar({
  pending,
  message,
  pendingDevRelease,
  runtimeStatus,
  taskOptions,
  primaryTaskId,
  linkedTaskIds,
  onPrimaryTaskChange,
  onLinkedTaskIdsChange,
  onCreateDev,
  onAcceptDev,
  onRejectDev,
}: ControlBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/72">
        <span>主 task</span>
        <select
          className="bg-transparent text-white outline-none"
          disabled={pending || Boolean(pendingDevRelease)}
          value={primaryTaskId}
          onChange={(event) => onPrimaryTaskChange(event.target.value)}
        >
          <option value="">请选择</option>
          {taskOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/72">
        <span>辅助 task</span>
        <select
          multiple
          className="min-h-16 bg-transparent text-white outline-none"
          disabled={pending || Boolean(pendingDevRelease)}
          value={linkedTaskIds}
          onChange={(event) =>
            onLinkedTaskIdsChange(
              Array.from(event.target.selectedOptions)
                .map((option) => option.value)
                .filter((value) => value !== primaryTaskId)
                .slice(0, 2)
            )
          }
        >
          {taskOptions
            .filter((option) => option.id !== primaryTaskId)
            .map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
        </select>
      </label>
      <button
        type="button"
        className="rounded-full border border-accent/40 bg-accent/14 px-4 py-2 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={pending || Boolean(pendingDevRelease) || !primaryTaskId}
        onClick={onCreateDev}
      >
        生成 dev 预览
      </button>
      {pendingDevRelease ? (
        <>
          <button
            type="button"
            className="rounded-full border border-emerald-400/40 bg-emerald-400/12 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pending}
            onClick={onAcceptDev}
          >
            验收通过并发布到 main
          </button>
          <button
            type="button"
            className="rounded-full border border-red-400/40 bg-red-400/12 px-4 py-2 text-sm text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pending}
            onClick={onRejectDev}
          >
            驳回当前 dev
          </button>
        </>
      ) : null}
      <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/68">
        本地运行态：{getRuntimeStatusExplanation(runtimeStatus.status).humanLabel}
      </span>
      {message ? <p className="text-sm text-white/68">{message}</p> : null}
    </div>
  );
}

export function ReleaseSummaryGrid({
  pendingDevRelease,
  activeReleaseId,
  previewUrl,
  productionUrl,
}: SummaryProps) {
  const pendingSummary = pendingDevRelease ? resolveReleaseContractSummary(pendingDevRelease) : null;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-accent">当前待验收 dev</p>
        <p className="mt-3 text-sm text-white/78">
          {pendingDevRelease
            ? `当前待验收版本为 ${pendingDevRelease.release_id}。请先验收这个 dev，再决定是否发布到 main。`
            : "当前没有待验收 dev，可以继续生成新的预览。"}
        </p>
        {pendingSummary?.summary ? <p className="mt-3 text-sm text-white/62">交付摘要：{pendingSummary.summary}</p> : null}
        <p className="mt-3 text-xs text-white/52">预览链接：{previewUrl}</p>
      </article>
      <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-accent">当前 production</p>
        <p className="mt-3 text-sm text-white/78">
          {activeReleaseId ? `当前生产版本为 ${activeReleaseId}。` : "当前还没有激活的生产版本。"}
        </p>
        <p className="mt-3 text-xs text-white/52">生产链接：{productionUrl}</p>
      </article>
    </div>
  );
}
