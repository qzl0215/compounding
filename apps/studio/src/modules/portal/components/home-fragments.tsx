import React from "react";
import Link from "next/link";
import type { CockpitRuntimeSignal, DemandStageItem } from "../types";

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

export function DemandItemList({
  items,
  empty,
}: {
  items: DemandStageItem[];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-white/58">{empty}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">{item.title}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/40">{item.source}</p>
            </div>
            {item.badge ? (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/64">{item.badge}</span>
            ) : null}
          </div>
          <p className="mt-3 text-sm leading-6 text-white/72">{item.summary}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
            <p className="text-xs uppercase tracking-[0.18em] text-accent/80">下一动作：{item.nextConversationAction}</p>
            <Link
              href={item.evidenceHref}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-accent transition hover:text-white"
            >
              查看证据
            </Link>
          </div>
        </article>
      ))}
    </div>
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
