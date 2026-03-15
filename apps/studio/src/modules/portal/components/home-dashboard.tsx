import Link from "next/link";
import { PageOutline } from "@/components/page-outline";
import { Card } from "@/components/ui/card";
import type { PortalOverview } from "../types";
import { BattleMetric, BulletPanel, InfoItem, LinkedCard, Pill, RoleCard, TaskList } from "./home-fragments";

const OUTLINE = [
  { id: "who-we-are", label: "我们是谁" },
  { id: "battle-board", label: "今天在打什么仗" },
  { id: "org-overview", label: "组织一览" },
  { id: "core-systems", label: "核心系统" },
  { id: "onboarding-path", label: "新人入职路径" },
  { id: "current-risks", label: "当前风险" },
];

export function HomeDashboard({ overview }: { overview: PortalOverview }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="space-y-6">
        <section id="who-we-are" className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <p className="text-xs uppercase tracking-[0.32em] text-accent">AI-Native Repo</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight">像创业团队一样运转的 AI 操作系统</h1>
            <p className="mt-4 max-w-3xl text-lg text-white/68">{overview.company.oneLiner}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {overview.company.mustProtect.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/76"
                >
                  {item}
                </span>
              ))}
            </div>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">我们是谁</p>
            <div className="mt-5 grid gap-4">
              <InfoItem title="项目一句话" value={overview.company.oneLiner} />
              <InfoItem title="当前阶段" value={overview.company.currentPhase} />
              <InfoItem title="成功定义" value={overview.company.successDefinition} />
              <div className="mt-2 flex flex-wrap gap-2">
                {overview.homeLinks.map((entry) => (
                  <Pill key={entry.scope} href={entry.href} label={entry.label} />
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section id="battle-board" className="grid gap-6 xl:grid-cols-[0.64fr_0.36fr]">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-accent">今天在打什么仗</p>
                <h2 className="mt-3 text-3xl font-semibold">当前主线与交付节奏</h2>
              </div>
              <Link
                href="/knowledge-base?path=memory/project/roadmap.md"
                className="rounded-full border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-accent transition hover:bg-accent/16"
              >
                查看路线图
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <BattleMetric title="当前优先级" value={overview.battle.currentPriority} />
              <BattleMetric title="当前主线" value={overview.battle.currentMainline} />
            </div>
            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.92fr]">
              <BulletPanel title="当前焦点" items={overview.battle.currentFocus} empty="当前焦点暂未写入。" />
              <BulletPanel title="下一检查点" items={overview.battle.nextCheckpoint} empty="下一检查点暂未写入。" />
            </div>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">任务温度</p>
            <div className="mt-5 space-y-4">
              <TaskList title="进行中" href="/tasks#task-doing" tasks={overview.battle.doingTasks} empty="当前没有进行中的任务。" />
              <TaskList title="阻塞中" href="/tasks#task-blocked" tasks={overview.battle.blockedTasks} empty="当前没有阻塞任务。" />
            </div>
          </Card>
        </section>

        <section id="org-overview">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-accent">组织一览</p>
                <h2 className="mt-3 text-3xl font-semibold">7 个核心角色，各司其职</h2>
              </div>
              <Link
                href="/knowledge-base?path=docs/ORG_MODEL.md"
                className="rounded-full border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-accent transition hover:bg-accent/16"
              >
                查看组织模型
              </Link>
            </div>
            <div className="mt-6 space-y-6">
              {overview.org.map((group) => (
                <section key={group.title}>
                  <p className="text-sm font-semibold tracking-[0.14em] text-white">{group.title}</p>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {group.roles.map((role) => (
                      <RoleCard key={role.name} role={role} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </Card>
        </section>

        <section id="core-systems">
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">核心系统</p>
            <h2 className="mt-3 text-3xl font-semibold">把高频协作收口成 5 个系统</h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {overview.systems.map((item) => (
                <LinkedCard key={item.title} item={item} />
              ))}
            </div>
          </Card>
        </section>

        <section id="onboarding-path">
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">新人入职路径</p>
            <h2 className="mt-3 text-3xl font-semibold">4 步看懂，再开始动手</h2>
            <div className="mt-6 grid gap-4 xl:grid-cols-4">
              {overview.onboarding.map((step, index) => (
                <Link
                  key={step.title}
                  href={step.href}
                  className="rounded-3xl border border-white/8 bg-white/[0.03] p-5 transition hover:border-accent/30 hover:bg-white/[0.05]"
                >
                  <span className="rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-xs tracking-[0.24em] text-accent">
                    STEP {index + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/72">{step.summary}</p>
                </Link>
              ))}
            </div>
          </Card>
        </section>

        <section id="current-risks">
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">当前风险</p>
            <h2 className="mt-3 text-3xl font-semibold">高风险点、技术债与发布状态</h2>
            <div className="mt-6 grid gap-4 xl:grid-cols-3">
              {overview.risks.map((item) => (
                <LinkedCard key={item.title} item={item} />
              ))}
            </div>
          </Card>
        </section>
      </div>
      <PageOutline items={OUTLINE} />
    </div>
  );
}
