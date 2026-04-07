import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/classnames";

type HeaderBadge = {
  label: string;
  tone?: BadgeTone;
};

type HeaderMetric = {
  label: string;
  value: string;
  tone?: BadgeTone;
};

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  note?: string;
  badges?: HeaderBadge[];
  metrics?: HeaderMetric[];
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, note, badges, metrics, actions, className }: PageHeaderProps) {
  return (
    <Card className={cn("overflow-hidden p-6 lg:p-8", className)}>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] xl:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-sky-700">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 lg:text-[3.5rem]">{title}</h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-slate-700">{description}</p>
          {note ? <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{note}</p> : null}
          {badges && badges.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {badges.map((badge, index) => (
                <Badge key={`${badge.label}-${badge.tone ?? "default"}-${index}`} tone={badge.tone}>
                  {badge.label}
                </Badge>
              ))}
            </div>
          ) : null}
          {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {metrics && metrics.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className={cn(
                  "rounded-[1.45rem] border px-4 py-4",
                  metric.tone === "accent" && "border-sky-200 bg-sky-50",
                  metric.tone === "success" && "border-emerald-200 bg-emerald-50",
                  metric.tone === "warning" && "border-amber-200 bg-amber-50",
                  metric.tone === "danger" && "border-rose-200 bg-rose-50",
                  !metric.tone && "border-slate-200 bg-white/90"
                )}
              >
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{metric.label}</p>
                <p className="mt-3 break-words text-sm font-medium leading-7 text-slate-900">{metric.value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
