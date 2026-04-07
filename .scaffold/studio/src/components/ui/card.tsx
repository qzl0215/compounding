import type { PropsWithChildren } from "react";
import { cn } from "@/lib/classnames";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className }: CardProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.9rem] border border-slate-200/80 bg-white/80 p-5 shadow-[0_24px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl",
        "before:pointer-events-none before:absolute before:inset-x-8 before:top-0 before:h-px before:content-[''] before:bg-gradient-to-r before:from-transparent before:via-sky-200/80 before:to-transparent",
        "after:pointer-events-none after:absolute after:-right-16 after:-top-20 after:size-52 after:rounded-full after:content-[''] after:bg-sky-100/70 after:blur-3xl",
        className
      )}
    >
      <div className="relative">{children}</div>
    </section>
  );
}
