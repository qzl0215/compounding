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
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <label className="flex flex-col gap-2 rounded-[1.35rem] border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700">
        <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500">主 task</span>
        <select
          className="min-w-0 appearance-none bg-transparent text-sm text-slate-900 outline-none"
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
      <label className="flex flex-col gap-2 rounded-[1.35rem] border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700">
        <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500">辅助 task</span>
        <select
          multiple
          className="min-h-[6.5rem] w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none"
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
      <div className="flex flex-wrap gap-3 xl:col-span-2">
        <button
          type="button"
          className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={pending || Boolean(pendingDevRelease) || !primaryTaskId}
          onClick={onCreateDev}
        >
          生成 dev 预览
        </button>
        {pendingDevRelease ? (
          <>
            <button
              type="button"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pending}
              onClick={onAcceptDev}
            >
              验收通过并发布到 main
            </button>
            <button
              type="button"
              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pending}
              onClick={onRejectDev}
            >
              驳回当前 dev
            </button>
          </>
        ) : null}
        <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
          本地运行态：{getRuntimeStatusExplanation(runtimeStatus.status).humanLabel}
        </span>
      </div>
      {message ? <p className="text-sm text-slate-600 xl:col-span-2">{message}</p> : null}
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
      <article className="rounded-3xl border border-slate-200 bg-white/90 p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-sky-700">当前待验收 dev</p>
        <p className="mt-3 text-sm text-slate-700">
          {pendingDevRelease
            ? `当前待验收版本为 ${pendingDevRelease.release_id}。请先验收这个 dev，再决定是否发布到 main。`
            : "当前没有待验收 dev，可以继续生成新的预览。"}
        </p>
        {pendingSummary?.summary ? <p className="mt-3 text-sm text-slate-600">交付摘要：{pendingSummary.summary}</p> : null}
        <p className="mt-3 text-xs text-slate-500">预览链接：{previewUrl}</p>
      </article>
      <article className="rounded-3xl border border-slate-200 bg-white/90 p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-sky-700">当前 production</p>
        <p className="mt-3 text-sm text-slate-700">
          {activeReleaseId ? `当前生产版本为 ${activeReleaseId}。` : "当前还没有激活的生产版本。"}
        </p>
        <p className="mt-3 text-xs text-slate-500">生产链接：{productionUrl}</p>
      </article>
    </div>
  );
}
