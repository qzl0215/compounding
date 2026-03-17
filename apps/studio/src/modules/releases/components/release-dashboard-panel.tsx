"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { LocalRuntimeStatus, ReleaseRecord } from "../types";
import { resolveReleaseActionRedirect, type ReleaseActionKind, type ReleaseActionResponse } from "../actions";

type Props = {
  releases: ReleaseRecord[];
  activeReleaseId: string | null;
  pendingDevRelease: ReleaseRecord | null;
  previewUrl: string;
  productionUrl: string;
  runtimeStatus: LocalRuntimeStatus;
};

export function ReleaseDashboardPanel({ releases, activeReleaseId, pendingDevRelease, previewUrl, productionUrl, runtimeStatus }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const runAction = (kind: ReleaseActionKind, url: string, payload: Record<string, string>) => {
    startTransition(async () => {
      try {
        setMessage("正在执行，请稍候…");
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = (await response.json()) as ReleaseActionResponse;
        setMessage(data.message ?? (response.ok ? "已完成。" : "执行失败。"));
        if (!response.ok) {
          return;
        }

        const redirectTarget = resolveReleaseActionRedirect(kind, data, previewUrl, productionUrl);
        if (redirectTarget && typeof window !== "undefined") {
          window.location.assign(redirectTarget);
          return;
        }

        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "执行失败，请稍后重试。");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-full border border-accent/40 bg-accent/14 px-4 py-2 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={pending || Boolean(pendingDevRelease)}
          onClick={() => runAction("create-dev", "/api/releases/dev", { ref: "HEAD" })}
        >
          生成 dev 预览
        </button>
        {pendingDevRelease ? (
          <>
            <button
              type="button"
              className="rounded-full border border-emerald-400/40 bg-emerald-400/12 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pending}
              onClick={() => runAction("accept-dev", "/api/releases/dev/accept", { releaseId: pendingDevRelease.release_id })}
            >
              验收通过并发布到 main
            </button>
            <button
              type="button"
              className="rounded-full border border-red-400/40 bg-red-400/12 px-4 py-2 text-sm text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pending}
              onClick={() => runAction("reject-dev", "/api/releases/dev/reject", { releaseId: pendingDevRelease.release_id })}
            >
              驳回当前 dev
            </button>
          </>
        ) : null}
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/68">
          本地运行态：{formatRuntimeStatus(runtimeStatus.status)}
        </span>
        {message ? <p className="text-sm text-white/68">{message}</p> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-accent">当前待验收 dev</p>
          <p className="mt-3 text-sm text-white/78">
            {pendingDevRelease
              ? `当前待验收版本为 ${pendingDevRelease.release_id}。请先验收这个 dev，再决定是否发布到 main。`
              : "当前没有待验收 dev，可以继续生成新的预览。"}
          </p>
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
                    onClick={() => runAction("rollback-prod", "/api/releases/rollback", { releaseId: release.release_id })}
                  >
                    回滚到此版本
                  </button>
                ) : null}
              </div>

              <dl className="mt-4 grid gap-3 text-sm text-white/72 md:grid-cols-2 xl:grid-cols-4">
                <Meta title="通道" value={release.channel === "dev" ? "dev 预览" : "production"} />
                <Meta title="来源分支" value={release.source_ref} />
                <Meta title="构建结果" value={release.build_result} />
                <Meta title="验收状态" value={formatAcceptance(release.acceptance_status)} />
                <Meta title="切换时间" value={release.cutover_at || release.promoted_to_main_at || "未切换"} />
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

function formatRuntimeStatus(status: LocalRuntimeStatus["status"]) {
  const labels: Record<LocalRuntimeStatus["status"], string> = {
    stopped: "未启动",
    running: "运行中",
    stale_pid: "PID 失效",
    port_error: "端口异常",
    drift: "版本漂移",
    unmanaged: "未托管进程占用",
  };
  return labels[status];
}
