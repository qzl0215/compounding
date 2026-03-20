import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { ProjectCockpit } from "../types";
import { BulletBlock, KeyStat, RuntimeSignalCard } from "./home-fragments";

export function HomeDashboard({ overview }: { overview: ProjectCockpit }) {
  const quickLinks = [
    { href: "/tasks", label: "任务页" },
    { href: "/releases", label: "发布页" },
    { href: "/knowledge-base?path=memory/project/current-state.md", label: "当前状态" },
  ];
  const successSummary = overview.currentFocus.successCriteria.slice(0, 2).join("；");

  return (
    <div className="space-y-6">
      <section id="project-decision-board">
        <Card>
          <p className="text-xs uppercase tracking-[0.32em] text-accent">决策板</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight">先判断现状，再下钻细节</h1>
          <p className="mt-4 max-w-3xl text-lg text-white/72">{overview.identity.oneLiner}</p>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/64">{overview.executionStatus.summary}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/74 transition hover:border-accent/30 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <section id="current-focus" className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">当前状态</p>
          <h2 className="mt-3 text-3xl font-semibold">当前状态</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <KeyStat title="当前阶段" value={overview.currentFocus.currentPhase} />
            <KeyStat title="当前里程碑" value={overview.currentFocus.currentMilestone} />
          </div>
          <div className="mt-6 rounded-3xl border border-white/8 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-white/40">当前优先级</p>
            <p className="mt-3 text-lg font-medium leading-8 text-white">{overview.currentFocus.currentPriority}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.22em] text-white/40">成功标准摘要</p>
            <p className="mt-2 text-sm leading-7 text-white/72">{successSummary || "里程碑成功标准尚未写入。"}</p>
          </div>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">运行与发布</p>
          <h2 className="mt-3 text-3xl font-semibold">production / dev 是否正常</h2>
          <div className="mt-5 grid gap-4">
            {overview.executionStatus.runtimeSignals.map((signal) => (
              <RuntimeSignalCard key={signal.label} signal={signal} />
            ))}
          </div>
          <div className="mt-4 rounded-3xl border border-white/8 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-white/40">待验收版本</p>
            <p className="mt-3 text-sm leading-7 text-white/72">{overview.riskBoard.pendingDevSummary ?? "当前没有待验收 dev。"}</p>
          </div>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">当前阻塞与下一步</p>
          <h2 className="mt-3 text-3xl font-semibold">当前阻塞与下一步</h2>
          <div className="mt-6 space-y-4">
            <BulletBlock
              title="当前阻塞"
              items={overview.executionStatus.blockedItems}
              empty="当前没有阻塞项。"
            />
            <BulletBlock
              title="下一检查点"
              items={overview.executionStatus.nextCheckpoint}
              empty="下一检查点尚未写入。"
            />
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/40">主源冲突</p>
              <p className="mt-3 text-sm leading-7 text-white/72">
                {overview.riskBoard.factConflicts.length > 0
                  ? overview.riskBoard.factConflicts.join("；")
                  : "当前未发现 AGENTS / roadmap / operating-blueprint / current-state 的主线冲突。"}
              </p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/40">关键冻结项</p>
              <p className="mt-3 text-sm leading-7 text-white/72">
                {overview.riskBoard.frozenItems.length > 0
                  ? overview.riskBoard.frozenItems.join("；")
                  : "当前没有额外冻结项。"}
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
