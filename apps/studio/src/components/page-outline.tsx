"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/classnames";

export type OutlineItem = {
  id: string;
  label: string;
};

type Props = {
  title?: string;
  items: OutlineItem[];
  emptyText?: string;
  className?: string;
};

export function PageOutline({ title = "页内导航", items, emptyText = "当前页面没有可导航区块。", className }: Props) {
  const uniqueItems = useMemo(() => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (!item.id || seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }, [items]);
  const [activeId, setActiveId] = useState<string | null>(uniqueItems[0]?.id ?? null);

  useEffect(() => {
    const available = uniqueItems.filter((item) => typeof document !== "undefined" && document.getElementById(item.id));
    if (available.length === 0) {
      setActiveId(null);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];

        if (visible?.target?.id) {
          setActiveId(visible.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0.1, 0.4, 0.8],
      }
    );

    available.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    setActiveId(available[0]?.id ?? null);

    return () => observer.disconnect();
  }, [uniqueItems]);

  return (
    <Card className={cn("h-fit xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-auto", className)}>
      <p className="text-xs uppercase tracking-[0.28em] text-accent">{title}</p>
      <div className="mt-4 space-y-2 text-sm text-white/72">
        {uniqueItems.length > 0 ? (
          uniqueItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                "block rounded-2xl border px-3 py-2 transition",
                activeId === item.id
                  ? "border-accent/40 bg-accent/10 text-white"
                  : "border-white/8 bg-white/[0.03] hover:border-accent/30 hover:text-white"
              )}
            >
              {item.label}
            </a>
          ))
        ) : (
          <p>{emptyText}</p>
        )}
      </div>
    </Card>
  );
}
