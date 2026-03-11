import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = PropsWithChildren<{
  tone?: "default" | "accent" | "success" | "danger";
}>;

export function Badge({ children, tone = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.24em]",
        tone === "accent" && "border-accent/50 bg-accent/10 text-accent",
        tone === "success" && "border-success/50 bg-success/10 text-success",
        tone === "danger" && "border-danger/50 bg-danger/10 text-danger",
        tone === "default" && "border-white/10 bg-white/5 text-white/70"
      )}
    >
      {children}
    </span>
  );
}
