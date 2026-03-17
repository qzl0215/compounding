import React from "react";
import { Card } from "@/components/ui/card";
import type { ProjectCockpit } from "../types";
import {
  BulletBlock,
  EvidenceGroupCard,
  KeyStat,
  RiskCard,
  RuntimeSignalCard,
  TaskFocusList,
} from "./home-fragments";

export function HomeDashboard({ overview }: { overview: ProjectCockpit }) {
  return (
    <div className="space-y-6">
      <section id="project-identity" className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.32em] text-accent">统一驾驶舱</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight">项目是什么</h1>
          <p className="mt-4 max-w-3xl text-lg text-white/72">{overview.identity.oneLiner}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <KeyStat title="项目使命" value={overview.identity.mission} />
            <KeyStat title="成功定义" value={overview.identity.successDefinition} />
          </div>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">必须保护</p>
          <h2 className="mt-3 text-3xl font-semibold">这轮不能破坏什么</h2>
          <p className="mt-4 text-sm leading-7 text-white/72">
            首页只做人类友好的投影，不制造第二套真相。后续如果要增强互动，也必须继续沿用同一套主源事实。
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {overview.identity.mustProtect.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/74"
              >
                {item}
              </span>
            ))}
          </div>
        </Card>
      </section>

      <section id="current-focus" className="grid gap-6 xl:grid-cols-[0.68fr_0.32fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">现在最重要的事</p>
          <h2 className="mt-3 text-3xl font-semibold">当前优先级与里程碑</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <KeyStat title="当前阶段" value={overview.currentFocus.currentPhase} />
            <KeyStat title="当前里程碑" value={overview.currentFocus.currentMilestone} />
          </div>
          <div className="mt-6 rounded-3xl border border-white/8 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-white/40">当前优先级</p>
            <p className="mt-3 text-lg font-medium leading-8 text-white">{overview.currentFocus.currentPriority}</p>
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/40">里程碑成功标准</p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-white/74">
                {overview.currentFocus.successCriteria.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">驾驶舱原则</p>
          <h2 className="mt-3 text-2xl font-semibold">先看主线，再下钻证据</h2>
          <p className="mt-4 text-sm leading-7 text-white/72">
            首页负责让人先判断方向、状态和风险；需要细节时，再进入任务、文档或发布页查看原始证据。
          </p>
        </Card>
      </section>

      <section id="execution-status">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">推进状态</p>
          <h2 className="mt-3 text-3xl font-semibold">当前主线在怎么推进</h2>
          <div className="mt-5 rounded-3xl border border-white/8 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-white/40">推进主线</p>
            <p className="mt-3 text-lg font-medium text-white">{overview.executionStatus.headline}</p>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/72">{overview.executionStatus.summary}</p>
          </div>
          <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
            <TaskFocusList
              title="进行中任务"
              href="/tasks#task-doing"
              tasks={overview.executionStatus.doingTasks}
              empty="当前没有进行中的任务。"
            />
            <BulletBlock title="当前阻塞" items={overview.executionStatus.blockedItems} empty="当前没有阻塞项。" />
            <BulletBlock title="下一检查点" items={overview.executionStatus.nextCheckpoint} empty="下一检查点尚未写入。" />
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {overview.executionStatus.runtimeSignals.map((signal) => (
              <RuntimeSignalCard key={signal.label} signal={signal} />
            ))}
          </div>
        </Card>
      </section>

      <section id="risk-board">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">风险与待决策</p>
          <h2 className="mt-3 text-3xl font-semibold">先看哪里可能失真或卡住</h2>
          <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <BulletBlock
                title="主源冲突"
                items={overview.riskBoard.factConflicts}
                empty="当前未发现 `AGENTS / roadmap / operating-blueprint / current-state` 的主线冲突。"
              />
              <BulletBlock title="关键冻结项" items={overview.riskBoard.frozenItems} empty="当前没有额外冻结项。" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              {overview.riskBoard.items.map((item) => (
                <RiskCard key={item.title} item={item} />
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section id="evidence-links">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">深入入口</p>
          <h2 className="mt-3 text-3xl font-semibold">需要细节时，去哪里看证据</h2>
          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {overview.evidenceLinks.map((group) => (
              <EvidenceGroupCard key={group.title} group={group} />
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
