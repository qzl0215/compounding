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
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/72">
        <span>交付状态</span>
        <select
          value={deliveryFilter}
          onChange={(event) => onDeliveryFilterChange(event.target.value as "all" | TaskDeliveryStatus)}
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
        <input type="checkbox" checked={pendingOnly} onChange={(event) => onPendingOnlyChange(event.target.checked)} />
        只看待验收
      </label>
      <span className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs text-white/62">当前显示 {filteredCount} 项</span>
      {message ? <p className="text-sm text-white/68">{message}</p> : null}
    </div>
  );
}
