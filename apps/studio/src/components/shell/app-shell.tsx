"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, LayoutDashboard, ListTodo, Rocket } from "lucide-react";
import type { PropsWithChildren } from "react";
import { cn } from "@/lib/classnames";

const navigation = [
  { href: "/", label: "驾驶舱", icon: LayoutDashboard },
  { href: "/tasks", label: "任务", icon: ListTodo },
  { href: "/knowledge-base", label: "文档", icon: BookOpen },
  { href: "/releases", label: "发布", icon: Rocket }
];

export function AppShell({ children, runtimeChannel }: PropsWithChildren<{ runtimeChannel: "dev" | "prod" }>) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-ink text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(57,208,255,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(241,177,87,0.12),transparent_22%)]" />
      <div className="pointer-events-none fixed inset-0 bg-grid-shell bg-[size:42px_42px] opacity-25" />
      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-5 lg:flex-row lg:px-6">
        <aside className="w-full rounded-[2rem] border border-line/70 bg-shell/85 p-4 shadow-glow backdrop-blur lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[290px]">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-accent">AI-Native Repo</p>
              <h1 className="mt-3 font-mono text-2xl font-semibold text-white">项目总览</h1>
              <p className="mt-2 text-sm text-white/65">先判断需求在哪个环节，再决定看任务、证据还是发布</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge tone={runtimeChannel === "dev" ? "warning" : "accent"}>{runtimeChannel === "dev" ? "DEV" : "PROD"}</Badge>
            </div>
          </div>
          <nav className="space-y-2">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group relative flex items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 text-sm transition",
                    active
                      ? "border-accent/45 bg-accent/12 text-white"
                      : "border-transparent bg-white/[0.02] text-white/70 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="nav-beam"
                      className="absolute inset-y-2 left-1 w-1 rounded-full bg-accent"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  ) : null}
                  <Icon className="size-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-8 rounded-3xl border border-white/8 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-white/45">阅读顺序</p>
            <p className="mt-3 text-sm leading-7 text-white/72">
              新问题先看首页判断它是待思考、待规划还是待执行；需要证据时去知识库，需要推进时去任务页，需要验收时去发布页。
            </p>
            <Link className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-accent" href="/knowledge-base">
              <BookOpen className="size-3.5" />
              打开证据库
            </Link>
          </div>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

function Badge({ children, tone = "default" }: { children: string; tone?: "default" | "accent" | "warning" }) {
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.24em]",
        tone === "accent"
          ? "border-accent/40 bg-accent/10 text-accent"
          : tone === "warning"
            ? "border-amber-400/40 bg-amber-400/12 text-amber-200"
            : "border-white/15 bg-white/5 text-white/60"
      )}
    >
      {children}
    </span>
  );
}
