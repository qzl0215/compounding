"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReleaseRecord } from "../types";

type Props = {
  releases: ReleaseRecord[];
  activeReleaseId: string | null;
};

export function ReleaseDashboardPanel({ releases, activeReleaseId }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const runAction = (url: string, payload: Record<string, string>) => {
    startTransition(async () => {
      setMessage("正在执行，请稍候…");
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { message?: string };
      setMessage(data.message ?? (response.ok ? "已完成。" : "执行失败。"));
      if (response.ok) {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-full border border-accent/40 bg-accent/14 px-4 py-2 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={pending}
          onClick={() => runAction("/api/releases/deploy", { ref: "main" })}
        >
          发布 main 当前版本
        </button>
        {message ? <p className="text-sm text-white/68">{message}</p> : null}
      </div>

      <div className="space-y-4">
        {releases.map((release) => {
          const isActive = release.release_id === activeReleaseId;
          return (
            <article key={release.release_id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{release.release_id}</h3>
                    <StatusBadge label={isActive ? "当前版本" : release.status} />
                  </div>
                  <p className="mt-2 font-mono text-xs text-white/42">{release.commit_sha}</p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/78 transition hover:border-accent/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={pending || isActive}
                  onClick={() => runAction("/api/releases/rollback", { releaseId: release.release_id })}
                >
                  回滚到此版本
                </button>
              </div>

              <dl className="mt-4 grid gap-3 text-sm text-white/72 md:grid-cols-2 xl:grid-cols-4">
                <Meta title="来源分支" value={release.source_ref} />
                <Meta title="构建结果" value={release.build_result} />
                <Meta title="烟雾检查" value={release.smoke_result} />
                <Meta title="切换时间" value={release.cutover_at || "未切换"} />
              </dl>

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
