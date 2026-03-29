"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, LayoutDashboard, ListTodo, Rocket, Workflow } from "lucide-react";
import type { PropsWithChildren } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/classnames";

const navigation = [
  { href: "/", label: "总览", icon: LayoutDashboard },
  { href: "/harness", label: "控制面", icon: Workflow },
  { href: "/tasks", label: "任务", icon: ListTodo },
  { href: "/knowledge-base", label: "证据", icon: BookOpen },
  { href: "/releases", label: "发布", icon: Rocket },
];

export function AppShell({ children, runtimeChannel }: PropsWithChildren<{ runtimeChannel: "dev" | "prod" }>) {
  const pathname = usePathname();
  const currentPage = navigation.find((item) => pathname === item.href) ?? navigation[0];

  return (
    <div className="min-h-screen bg-ink text-slate-900">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(14,165,233,0.16),transparent_26%),radial-gradient(circle_at_88%_2%,rgba(245,158,11,0.1),transparent_20%),radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.08),transparent_22%)]" />
      <div className="pointer-events-none fixed inset-0 bg-grid-shell bg-[size:44px_44px] opacity-[0.2]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1680px] flex-col gap-5 px-4 py-4 lg:flex-row lg:px-5 lg:py-5">
        <aside className="w-full overflow-hidden rounded-[1.9rem] border border-slate-200/80 bg-white/85 p-3 shadow-[0_24px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:w-[240px] lg:flex-none lg:p-4">
          <div className="rounded-[1.45rem] border border-slate-200 bg-slate-50/90 p-4">
            <p className="text-[11px] uppercase tracking-[0.32em] text-sky-700">AI-native repo</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900">Compounding</h1>
            <p className="mt-3 text-xs leading-5 text-slate-600">用于查看态势、证据、任务和发布事实的项目控制台。</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone={runtimeChannel === "dev" ? "warning" : "accent"}>{runtimeChannel === "dev" ? "DEV" : "PROD"}</Badge>
              <Badge tone="default">{currentPage.label}</Badge>
            </div>
          </div>

          <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group relative flex items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 text-sm transition",
                    active
                      ? "border-sky-200 bg-sky-50 text-slate-900 shadow-[0_0_0_1px_rgba(14,165,233,0.08)]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="nav-beam"
                      className="absolute inset-y-2 left-1 w-1 rounded-full bg-sky-500"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  ) : null}
                  <Icon className="size-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 rounded-[1.45rem] border border-slate-200 bg-slate-50 px-3 py-3 lg:mt-auto">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">当前页</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{currentPage.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">保持当前路由与执行面一致。</p>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
