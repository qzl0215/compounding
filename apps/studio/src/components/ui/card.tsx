import type { PropsWithChildren } from "react";
import { cn } from "@/lib/classnames";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-line/80 bg-panel/70 p-5 shadow-glow backdrop-blur-xl",
        className
      )}
    >
      {children}
    </section>
  );
}
