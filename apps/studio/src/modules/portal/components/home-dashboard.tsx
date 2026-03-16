import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { PortalOverview } from "../types";
import {
  ActionPill,
  BlueprintGoalCard,
  BulletBlock,
  KeyStat,
  LinkedSummaryCard,
  RoleCardCompact,
  TaskFocusList,
  WorkModeFlowNode,
} from "./home-fragments";

export function HomeDashboard({ overview }: { overview: PortalOverview }) {
  return (
    <div className="space-y-6">
      <section id="mission-values" className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.32em] text-accent">经营驾驶舱</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight">使命 / 愿景 / 价值主张</h1>
          <p className="mt-4 max-w-3xl text-lg text-white/72">{overview.identity.oneLiner}</p>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <KeyStat title="使命" value={overview.identity.mission} />
            <KeyStat title="愿景" value={overview.identity.vision} />
          </div>
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.24em] text-white/40">核心价值观</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {overview.identity.values.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-sm text-white/78"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">关键约束</p>
          <h2 className="mt-3 text-3xl font-semibold">核心约束与保护项</h2>
          <p className="mt-4 text-sm leading-7 text-white/72">{overview.identity.successDefinition}</p>
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
          <div className="mt-6 flex flex-wrap gap-2">
            {overview.homeLinks.map((entry) => (
              <ActionPill key={entry.scope} href={entry.href} label={entry.label} />
            ))}
          </div>
        </Card>
      </section>

      <section id="roadmap" className="grid gap-6 xl:grid-cols-[0.62fr_0.38fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-accent">战略路线与下一里程碑</p>
              <h2 className="mt-3 text-3xl font-semibold">阶段目标与里程碑要求</h2>
            </div>
            <Link
              href="/knowledge-base?path=memory/project/roadmap.md"
              className="rounded-full border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-accent transition hover:bg-accent/16"
            >
              查看路线图
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <KeyStat title="当前阶段" value={overview.roadmap.currentPhase} />
            <KeyStat title="当前优先级" value={overview.roadmap.currentPriority} />
          </div>
          <div className="mt-6 rounded-3xl border border-white/8 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-white/40">下个里程碑</p>
            <p className="mt-3 text-lg font-medium leading-8 text-white">{overview.roadmap.nextMilestone}</p>
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/40">里程碑成功标准</p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-white/74">
                {overview.roadmap.successCriteria.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">当前阶段镜像</p>
          <div className="mt-5 space-y-4">
            <KeyStat title="当前主线" value={overview.blueprint.currentMainline} />
            <KeyStat title="当前里程碑" value={overview.blueprint.currentMilestone} />
          </div>
        </Card>
      </section>

      <section id="operating-blueprint" className="space-y-6">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-accent">当前战役与运营蓝图</p>
              <h2 className="mt-3 text-3xl font-semibold">子目标拆解与推进状态</h2>
            </div>
            <Link
              href="/knowledge-base?path=memory/project/operating-blueprint.md"
              className="rounded-full border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-accent transition hover:bg-accent/16"
            >
              查看运营蓝图
            </Link>
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.92fr]">
            <div className="grid gap-4 lg:grid-cols-2">
              {overview.blueprint.goals.map((goal) => (
                <BlueprintGoalCard key={goal.title} goal={goal} />
              ))}
            </div>
            <div className="space-y-4">
              <TaskFocusList title="进行中任务" href="/tasks#task-doing" tasks={overview.blueprint.doingTasks} empty="当前没有进行中的任务。" />
              <BulletBlock title="当前阻塞" items={overview.blueprint.blockedItems} empty="当前没有阻塞项。" />
              <BulletBlock title="下一检查点" items={overview.blueprint.nextCheckpoint} empty="下一检查点尚未写入。" />
            </div>
          </div>
        </Card>
      </section>

      <section id="work-mode-flow">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-accent">工作模式链路</p>
              <h2 className="mt-3 text-3xl font-semibold">需求到发布的标准业务链</h2>
            </div>
            <Link
              href="/knowledge-base?path=docs/WORK_MODES.md"
              className="rounded-full border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-accent transition hover:bg-accent/16"
            >
              查看工作模式
            </Link>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {overview.workModeFlow.map((step, index) => (
              <WorkModeFlowNode key={`${step.kind}-${step.name}`} step={step} index={index} />
            ))}
          </div>
        </Card>
      </section>

      <section id="org-model">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-accent">组织职责矩阵</p>
              <h2 className="mt-3 text-3xl font-semibold">角色职责与协作边界</h2>
            </div>
            <Link
              href="/knowledge-base?path=docs/ORG_MODEL.md"
              className="rounded-full border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-accent transition hover:bg-accent/16"
            >
              查看完整职责
            </Link>
          </div>
          <div className="mt-6 space-y-6">
            {overview.org.map((group) => (
              <section key={group.title}>
                <p className="text-sm font-semibold tracking-[0.14em] text-white">{group.title}</p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {group.roles.map((role) => (
                    <RoleCardCompact key={role.name} role={role} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Card>
      </section>

      <section id="knowledge-risk">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">关键认知资产与风险</p>
          <h2 className="mt-3 text-3xl font-semibold">认知基础设施、冻结项与发布风险</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {overview.knowledgeRisk.map((item) => (
              <LinkedSummaryCard key={item.title} item={item} />
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
