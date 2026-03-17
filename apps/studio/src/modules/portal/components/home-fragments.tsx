import React from "react";
import Link from "next/link";
import type {
  CockpitEvidenceGroup,
  CockpitRiskItem,
  CockpitRuntimeSignal,
  TaskSummary,
} from "../types";

export function KeyStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/38">{title}</p>
      <p className="mt-3 text-base font-medium leading-7 text-white">{value}</p>
    </div>
  );
}

export function BulletBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/38">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-white/76">
          {items.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-white/60">{empty}</p>
      )}
    </div>
  );
}

export function TaskFocusList({ title, tasks, href, empty }: { title: string; tasks: TaskSummary[]; href: string; empty: string }) {
  return (
    <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-white/38">{title}</p>
        <Link href={href} className="text-xs text-accent transition hover:text-white">
          查看任务详情
        </Link>
      </div>
      {tasks.length > 0 ? (
        <div className="mt-4 space-y-3">
          {tasks.map((task) => (
            <Link
              key={task.path}
              href={`/knowledge-base?path=${encodeURIComponent(task.path)}`}
              className="block rounded-2xl border border-white/8 bg-black/20 px-3 py-3 transition hover:border-accent/30"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">{task.title}</p>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/62">
                  {task.status}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/66">{task.goal}</p>
              {task.updateTrace ? <p className="mt-2 text-xs text-white/42">{task.updateTrace}</p> : null}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-white/60">{empty}</p>
      )}
    </section>
  );
}

export function RuntimeSignalCard({ signal }: { signal: CockpitRuntimeSignal }) {
  return (
    <Link
      href={signal.href}
      className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-accent/30 hover:bg-white/[0.05]"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-accent">{signal.label}</p>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/68">
          {signal.status}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/74">{signal.summary}</p>
    </Link>
  );
}

export function RiskCard({ item }: { item: CockpitRiskItem }) {
  const tone =
    item.tone === "danger"
      ? "border-red-400/20 bg-red-400/10"
      : item.tone === "warning"
        ? "border-amber-400/20 bg-amber-400/10"
        : "border-emerald-400/20 bg-emerald-400/10";

  return (
    <Link href={item.href} className={`rounded-3xl border p-5 transition hover:border-accent/30 ${tone}`}>
      <p className="text-xs uppercase tracking-[0.24em] text-white/72">{item.title}</p>
      <p className="mt-3 text-sm leading-6 text-white">{item.summary}</p>
    </Link>
  );
}

export function EvidenceGroupCard({ group }: { group: CockpitEvidenceGroup }) {
  return (
    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-accent">{group.title}</p>
      <div className="mt-4 space-y-3">
        {group.items.map((item) => (
          <Link
            key={`${group.title}-${item.title}`}
            href={item.href}
            className="block rounded-2xl border border-white/8 bg-black/20 px-3 py-3 transition hover:border-accent/30"
          >
            <p className="text-sm font-medium text-white">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-white/66">{item.summary}</p>
          </Link>
        ))}
      </div>
    </article>
  );
}
