import type { ReleaseRecord } from "../types";

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
        return (
          <article key={release.release_id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">{release.release_id}</h3>
                  <StatusBadge label={isActive ? "当前生产版本" : isPendingDev ? "待验收 dev" : formatReleaseStatus(release.status)} />
                  <StatusBadge label={release.channel === "dev" ? "dev" : "prod"} />
                </div>
                <p className="mt-2 font-mono text-xs text-white/42">{release.commit_sha}</p>
              </div>
              {release.channel === "prod" ? (
                <button
                  type="button"
                  className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/78 transition hover:border-accent/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={pending || isActive}
                  onClick={() => onRollback(release.release_id)}
                >
                  回滚到此版本
                </button>
              ) : null}
            </div>

            <dl className="mt-4 grid gap-3 text-sm text-white/72 md:grid-cols-2 xl:grid-cols-4">
              <Meta title="通道" value={release.channel === "dev" ? "dev 预览" : "production"} />
              <Meta title="来源分支" value={release.source_ref} />
              <Meta title="主 task" value={release.primary_task_id || "未绑定"} />
              <Meta title="构建结果" value={release.build_result} />
              <Meta title="验收状态" value={formatAcceptance(release.acceptance_status)} />
              <Meta title="切换时间" value={release.cutover_at || release.promoted_to_main_at || "未切换"} />
            </dl>

            {release.delivery_summary || release.delivery_benefit || release.delivery_risks ? (
              <div className="mt-4 grid gap-3 text-sm text-white/72 md:grid-cols-3">
                <Meta title="交付摘要" value={release.delivery_summary || "未记录"} />
                <Meta title="交付收益" value={release.delivery_benefit || "未记录"} />
                <Meta title="交付风险" value={release.delivery_risks || "未记录"} />
              </div>
            ) : null}

            {release.linked_task_ids.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.24em] text-accent">辅助 task</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {release.linked_task_ids.map((taskId) => (
                    <span key={taskId} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/66">
                      {taskId}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {release.change_summary.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.24em] text-accent">近期改动</p>
                <ul className="mt-3 space-y-2 text-sm text-white/72">
                  {release.change_summary.map((item) => (
                    <li key={item} className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {release.notes.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.24em] text-accent">发布备注</p>
                <ul className="mt-3 space-y-2 text-sm text-white/62">
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
    <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
      <dt className="text-xs uppercase tracking-[0.22em] text-white/40">{title}</dt>
      <dd className="mt-2 text-white">{value}</dd>
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  return <span className="rounded-full border border-accent/35 bg-accent/12 px-3 py-1 text-xs text-accent">{label}</span>;
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
