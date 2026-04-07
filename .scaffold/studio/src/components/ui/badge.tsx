import type { PropsWithChildren } from "react";
import { cn } from "@/lib/classnames";

export type BadgeTone = "default" | "accent" | "success" | "danger" | "warning";

type BadgeProps = PropsWithChildren<{
  tone?: BadgeTone;
}>;

export function Badge({ children, tone = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] backdrop-blur",
        tone === "accent" && "border-sky-200 bg-sky-50 text-sky-700",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "danger" && "border-rose-200 bg-rose-50 text-rose-700",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "default" && "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      {children}
    </span>
  );
}
