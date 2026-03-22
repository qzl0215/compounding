import React from "react";
import type { HomepageStat } from "../types";

export function SummaryStat({ item }: { item: HomepageStat }) {
  return (
    <article className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/42">{item.label}</p>
      <p className="mt-3 text-lg font-semibold leading-7 text-white">{item.value}</p>
    </article>
  );
}
