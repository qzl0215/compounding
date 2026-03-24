import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/classnames";
import type { GovernanceBucket, OverviewEntry, OverviewTone, ProjectBoundaryGroup, ProjectExecutionMetric } from "../types";

export function MetricTile({ item }: { item: ProjectExecutionMetric }) {
  return (
    <article className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/42">{item.label}</p>
      <p className={cn("mt-3 text-lg font-semibold leading-7 text-white", toneToTextClass(item.tone))}>{item.value}</p>
      {item.detail ? <p className="mt-2 text-sm leading-6 text-white/58">{item.detail}</p> : null}
    </article>
  );
}

export function ToneBadge({ children, tone = "default" }: { children: ReactNode; tone?: OverviewTone }) {
  return (
    <Badge tone={tone === "warning" ? "default" : tone === "danger" ? "danger" : tone === "success" ? "success" : tone === "accent" ? "accent" : "default"}>
      {children}
    </Badge>
  );
}

export function EntryTile({ entry }: { entry: OverviewEntry }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-white">{entry.label}</p>
        {entry.tone ? <ToneBadge tone={entry.tone}>{toneLabel(entry.tone)}</ToneBadge> : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-white/65">{entry.description}</p>
      {entry.path ? <p className="mt-3 break-all font-mono text-[11px] leading-5 text-white/45">{entry.path}</p> : null}
      {entry.meta ? <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/35">{entry.meta}</p> : null}
    </>
  );

  if (!entry.href) {
    return <article className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">{content}</article>;
  }

  return (
    <Link
      href={entry.href}
      className="block rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 transition hover:border-accent/30 hover:bg-white/[0.05]"
    >
      {content}
    </Link>
  );
}

export function GovernanceTile({ bucket }: { bucket: GovernanceBucket }) {
  return (
    <article className="rounded-[1.6rem] border border-white/8 bg-black/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/42">{bucket.label}</p>
          <p className="mt-3 text-sm leading-6 text-white/68">{bucket.description}</p>
        </div>
        <ToneBadge tone={bucket.tone}>{bucket.status}</ToneBadge>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricShell label="资产数" value={String(bucket.count)} tone={bucket.tone} />
        <MetricShell label="缺失数" value={String(bucket.missingCount)} tone={bucket.missingCount > 0 ? "danger" : "success"} />
      </div>
      <p className="mt-4 text-sm leading-6 text-white/58">{bucket.note}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ListBlock title="示例路径" items={bucket.highlights} emptyText="当前没有摘要路径。" />
        <ListBlock title="缺失路径" items={bucket.missing} emptyText="当前没有缺失项。" />
      </div>
    </article>
  );
}

export function BoundaryTile({ group }: { group: ProjectBoundaryGroup }) {
  return (
    <article className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-white/42">{group.label}</p>
        <ToneBadge tone={group.tone}>{group.items.length > 0 ? `${group.items.length} 项` : "empty"}</ToneBadge>
      </div>
      {group.items.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {group.items.slice(0, 4).map((item) => (
            <li key={item} className="break-all rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 font-mono text-xs text-white/72">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm leading-6 text-white/52">{group.empty}</p>
      )}
    </article>
  );
}

function ListBlock({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-white/38">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item} className="break-all rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 font-mono text-[11px] leading-5 text-white/68">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-white/45">{emptyText}</p>
      )}
    </div>
  );
}

function MetricShell({ label, value, tone = "default" }: { label: string; value: string; tone?: OverviewTone }) {
  return (
    <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/38">{label}</p>
      <p className={cn("mt-3 text-2xl font-semibold text-white", toneToTextClass(tone))}>{value}</p>
    </div>
  );
}

function toneLabel(tone: OverviewTone) {
  if (tone === "accent") {
    return "live";
  }
  if (tone === "success") {
    return "ok";
  }
  if (tone === "warning") {
    return "focus";
  }
  if (tone === "danger") {
    return "risk";
  }
  return "info";
}

function toneToTextClass(tone?: OverviewTone) {
  if (tone === "accent") {
    return "text-accent";
  }
  if (tone === "success") {
    return "text-success";
  }
  if (tone === "warning") {
    return "text-amber-200";
  }
  if (tone === "danger") {
    return "text-danger";
  }
  return "";
}
