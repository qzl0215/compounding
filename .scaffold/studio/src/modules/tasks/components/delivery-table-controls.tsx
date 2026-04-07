import type { TaskDeliveryStatus } from "../types";

type Props = {
  deliveryFilter: "all" | TaskDeliveryStatus;
  pendingOnly: boolean;
  filteredCount: number;
  message: string | null;
  onDeliveryFilterChange(value: "all" | TaskDeliveryStatus): void;
  onPendingOnlyChange(value: boolean): void;
};

export function DeliveryTableControls({
  deliveryFilter,
  pendingOnly,
  filteredCount,
  message,
  onDeliveryFilterChange,
  onPendingOnlyChange,
}: Props) {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-center">
      <label className="flex items-center gap-3 rounded-[1.35rem] border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700">
        <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500">交付状态</span>
        <select
          value={deliveryFilter}
          onChange={(event) => onDeliveryFilterChange(event.target.value as "all" | TaskDeliveryStatus)}
          className="min-w-[10rem] appearance-none bg-transparent text-sm text-slate-900 outline-none"
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
      <label className="flex items-center gap-3 rounded-[1.35rem] border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={pendingOnly}
          onChange={(event) => onPendingOnlyChange(event.target.checked)}
          className="size-4 rounded border-slate-300 bg-white text-sky-600 focus:ring-2 focus:ring-sky-200"
        />
        <span>只看待验收</span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">当前显示 {filteredCount} 项</span>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </div>
  );
}
