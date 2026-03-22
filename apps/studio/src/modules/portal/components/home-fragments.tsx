import React from "react";
import Link from "next/link";
import type { CockpitRuntimeSignal } from "../types";

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
