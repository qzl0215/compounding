import React from "react";
import Link from "next/link";
import type { HomeEntryLink, HomepageDecision, HomepageStageStat, HomepageStat } from "../types";

export function SummaryStat({ item }: { item: HomepageStat }) {
  return (
    <article className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/42">{item.label}</p>
      <p className="mt-3 text-lg font-semibold leading-7 text-white">{item.value}</p>
    </article>
  );
}

export function StageStatStrip({ items }: { items: HomepageStageStat[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-5">
      {items.map((item) => (
        <article key={item.label} className="rounded-[1.5rem] border border-white/8 bg-black/15 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-accent">{item.label}</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-2xl font-semibold text-white">{item.value}</p>
            <p className="text-xs text-white/48">{item.hint}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function DecisionCard({ item }: { item: HomepageDecision }) {
  return (
    <article className="rounded-[1.75rem] border border-accent/18 bg-accent/8 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent/80">当前判断</p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-white">{item.title}</h2>
        </div>
        {item.badge ? <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] text-white/68">{item.badge}</span> : null}
      </div>
      <p className="mt-4 text-sm leading-7 text-white/78">{item.summary}</p>
      <Link href={item.evidenceHref} className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-accent transition hover:text-white">
        {item.ctaLabel}
      </Link>
    </article>
  );
}

export function RouteChoiceStrip({ items }: { items: HomeEntryLink[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 transition hover:border-accent/30 hover:bg-white/[0.05]"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-accent">{item.label}</p>
          <p className="mt-2 text-sm leading-6 text-white/74">{item.description}</p>
        </Link>
      ))}
    </div>
  );
}
