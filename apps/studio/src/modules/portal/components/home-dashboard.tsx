"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/classnames";
import type { HomeTabId, ProjectOverviewSnapshot } from "../types";
import { ToneBadge } from "./home-fragments";
import { KernelPanel } from "./home-dashboard-kernel-panel";
import { ProjectPanel } from "./home-dashboard-project-panel";

const TABS: Array<{ id: HomeTabId; label: string; description: string }> = [
  { id: "project", label: "Project", description: "当前仓库的接入状态、执行态势和边界。" },
  { id: "kernel", label: "Kernel", description: "跨项目复用的 AI 工程规范和升级路径。" },
];

export function HomeDashboard({ overview }: { overview: ProjectOverviewSnapshot }) {
  const [activeTab, setActiveTab] = useState<HomeTabId>(overview.defaultTab);

  return (
    <div className="space-y-6">
      <section id="home-surface">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs uppercase tracking-[0.32em] text-accent">{overview.header.eyebrow}</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight">{overview.header.title}</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-white/72">{overview.header.description}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <ToneBadge tone="accent">{overview.header.workspaceLabel}</ToneBadge>
                <span className="break-all font-mono text-xs text-white/48">{overview.header.workspacePath}</span>
              </div>
            </div>
            <div className="w-full max-w-[420px]">
              <div
                role="tablist"
                aria-label="首页视图"
                className="grid grid-cols-2 gap-2 rounded-[1.75rem] border border-white/8 bg-black/25 p-2"
              >
                {TABS.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      id={`${tab.id}-tab`}
                      role="tab"
                      aria-selected={active}
                      aria-controls={`${tab.id}-panel`}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "relative overflow-hidden rounded-[1.2rem] px-4 py-4 text-left transition",
                        active ? "text-white" : "text-white/60 hover:text-white",
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="home-tab-surface"
                          className="absolute inset-0 rounded-[1.2rem] border border-accent/30 bg-accent/12"
                          transition={{ type: "spring", stiffness: 320, damping: 34 }}
                        />
                      ) : null}
                      <span className="relative block text-xs uppercase tracking-[0.24em] text-white/40">{tab.label}</span>
                      <span className="relative mt-2 block text-sm leading-6">{tab.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section id="home-tab-panel">
        {activeTab === "project" ? (
          <ProjectPanel overview={overview} />
        ) : (
          <KernelPanel overview={overview} />
        )}
      </section>
    </div>
  );
}
