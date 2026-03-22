import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { ProjectOverviewSnapshot } from "../types";
import { DemandItemList, BulletBlock, KeyStat, RuntimeSignalCard } from "./home-fragments";

export function HomeDashboard({ overview }: { overview: ProjectOverviewSnapshot }) {
  const homepage = overview.homepage;
  const quickLinks = [
    { href: "/tasks", label: "执行面板" },
    { href: "/releases", label: "发布事实" },
    { href: "/knowledge-base?path=memory/project/current-state.md", label: "当前状态" },
  ];

  return (
    <div className="space-y-6">
      <section id="project-overview">
        <Card>
          <p className="text-xs uppercase tracking-[0.32em] text-accent">{homepage.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight">{homepage.headline}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/74">{homepage.subheadline}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {homepage.primaryStats.map((item) => (
              <KeyStat key={item.label} title={item.label} value={item.value} />
            ))}
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {homepage.stageStats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
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

      <section id="thinking-planning" className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">待思考事项</p>
          <h2 className="mt-3 text-3xl font-semibold">{homepage.sectionHints.thinking}</h2>
          <div className="mt-6">
            <DemandItemList items={overview.thinkingItems} empty="当前没有额外待思考事项。若有新想法，先写入运营蓝图而不是直接进 task。" />
          </div>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">待规划事项</p>
          <h2 className="mt-3 text-3xl font-semibold">{homepage.sectionHints.planning}</h2>
          <div className="mt-6">
            <DemandItemList items={overview.planningItems} empty="当前没有额外待规划事项。若方向已成立但边界未定，先写入路线图或规划 task。" />
          </div>
        </Card>
      </section>

      <section id="execution-board">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">执行面板</p>
          <h2 className="mt-3 text-3xl font-semibold">{homepage.sectionHints.execution}</h2>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">待执行</p>
              <div className="mt-3">
                <DemandItemList
                  items={overview.readyItems}
                  empty="当前没有新的待执行事项。若事情还没说清，先回到待思考或待规划。"
                />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">执行中</p>
              <div className="mt-3">
                <DemandItemList items={overview.doingItems} empty="当前没有执行中的事项。" />
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section id="acceptance-runtime" className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">验收与运行</p>
          <h2 className="mt-3 text-3xl font-semibold">{homepage.sectionHints.acceptance}</h2>
          <div className="mt-6">
            <DemandItemList items={overview.acceptanceItems} empty="当前没有待验收事项，可以回到待思考、待规划或待执行。" />
          </div>
          <div className="mt-6">
            <BulletBlock
              title="最近结果"
              items={overview.releasedItems.map((item) => item.title)}
              empty="当前没有额外已发布结果需要强调。"
            />
          </div>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">运行事实</p>
          <h2 className="mt-3 text-3xl font-semibold">先看结论，再看细节</h2>
          <div className="mt-5 grid gap-4">
            {overview.runtimeFacts.runtimeSignals.map((signal) => (
              <RuntimeSignalCard key={signal.label} signal={signal} />
            ))}
          </div>
          <div className="mt-4 rounded-3xl border border-white/8 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-white/40">当前待验收版本</p>
            <p className="mt-3 text-sm leading-7 text-white/72">{overview.runtimeFacts.pendingDevSummary}</p>
          </div>
          <div className="mt-4 space-y-4">
            <BulletBlock title="当前阻塞" items={overview.runtimeFacts.blockedItems} empty="当前没有阻塞项。" />
            <BulletBlock title="下一检查点" items={overview.runtimeFacts.nextCheckpoint} empty="下一检查点尚未写入。" />
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/40">关键冻结项</p>
              <p className="mt-3 text-sm leading-7 text-white/72">
                {overview.runtimeFacts.frozenItems.length > 0
                  ? overview.runtimeFacts.frozenItems.join("；")
                  : "当前没有额外冻结项。"}
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
