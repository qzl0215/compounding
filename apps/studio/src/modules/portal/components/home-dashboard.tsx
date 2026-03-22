import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { ProjectOverviewSnapshot } from "../types";
import { DemandItemList, BulletBlock, KeyStat, RuntimeSignalCard } from "./home-fragments";
import { DEMAND_STAGE_HINTS } from "../stage-model";

export function HomeDashboard({ overview }: { overview: ProjectOverviewSnapshot }) {
  const quickLinks = [
    { href: "/tasks", label: "执行面板" },
    { href: "/releases", label: "发布事实" },
    { href: "/knowledge-base?path=memory/project/roadmap.md", label: "证据库" },
  ];
  const stageCounts = [
    { label: "待思考", value: String(overview.thinkingItems.length) },
    { label: "待规划", value: String(overview.planningItems.length) },
    { label: "待执行", value: String(overview.readyItems.length) },
    { label: "执行中", value: String(overview.doingItems.length) },
    { label: "待验收", value: String(overview.acceptanceItems.length) },
  ];

  return (
    <div className="space-y-6">
      <section id="project-overview">
        <Card>
          <p className="text-xs uppercase tracking-[0.32em] text-accent">需求环节总图</p>
          <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight">先判断事情在哪个环节，再决定怎么推进</h1>
          <p className="mt-4 max-w-3xl text-lg text-white/72">{overview.overview.oneLiner}</p>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/64">{overview.overview.currentPriority}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KeyStat title="当前阶段" value={overview.overview.currentPhase} />
            <KeyStat title="当前里程碑" value={overview.overview.currentMilestone} />
            <KeyStat title="下一阶段方向" value={overview.direction.summary} />
            <KeyStat title="首页判断原则" value="先分清待思考、待规划还是待执行" />
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {stageCounts.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-3xl border border-accent/15 bg-accent/8 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-accent/80">AI 下一步</p>
            <p className="mt-2 text-sm leading-7 text-white/80">{overview.direction.nextConversationAction}</p>
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
          <p className="text-xs uppercase tracking-[0.28em] text-accent">待思考</p>
          <h2 className="mt-3 text-3xl font-semibold">先把问题问对，再决定要不要开工</h2>
          <p className="mt-4 text-sm leading-7 text-white/68">{DEMAND_STAGE_HINTS.thinking}</p>
          <div className="mt-6">
            <DemandItemList items={overview.thinkingItems} empty="当前没有额外待思考事项。若有新想法，先写入运营蓝图而不是直接进 task。" />
          </div>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">待规划</p>
          <h2 className="mt-3 text-3xl font-semibold">方向成立了，但还不能直接进执行</h2>
          <p className="mt-4 text-sm leading-7 text-white/68">{DEMAND_STAGE_HINTS.planning}</p>
          <div className="mt-6">
            <DemandItemList items={overview.planningItems} empty="当前没有额外待规划事项。若方向已成立但边界未定，先写入路线图或规划 task。" />
          </div>
        </Card>
      </section>

      <section id="execution-board">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">待执行 / 执行中</p>
          <h2 className="mt-3 text-3xl font-semibold">只有边界说清了，才进入 task</h2>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">{DEMAND_STAGE_HINTS.ready}</p>
              <div className="mt-3">
                <DemandItemList
                  items={overview.readyItems}
                  empty="当前没有新的待执行事项。若事情还没说清，先回到待思考或待规划。"
                />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">{DEMAND_STAGE_HINTS.doing}</p>
              <div className="mt-3">
                <DemandItemList items={overview.doingItems} empty="当前没有执行中的事项。" />
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section id="acceptance-runtime" className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">待验收 / 已发布</p>
          <h2 className="mt-3 text-3xl font-semibold">先完成验收，再决定下一轮动作</h2>
          <p className="mt-4 text-sm leading-7 text-white/68">{DEMAND_STAGE_HINTS.acceptance}</p>
          <div className="mt-6">
            <DemandItemList items={overview.acceptanceItems} empty="当前没有待验收事项，可以回到待思考、待规划或待执行。" />
          </div>
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">{DEMAND_STAGE_HINTS.released}</p>
            <div className="mt-3">
              <DemandItemList items={overview.releasedItems} empty="当前没有额外 released 结果需要强调。" />
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">运行事实</p>
          <h2 className="mt-3 text-3xl font-semibold">需求判断和运行判断要一起看</h2>
          <p className="mt-4 text-sm leading-7 text-white/68">{overview.runtimeFacts.summary}</p>
          <div className="mt-5 grid gap-4">
            {overview.runtimeFacts.runtimeSignals.map((signal) => (
              <RuntimeSignalCard key={signal.label} signal={signal} />
            ))}
          </div>
          <div className="mt-4 rounded-3xl border border-white/8 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-white/40">待验收版本</p>
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
