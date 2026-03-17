import Link from "next/link";
import type { BlueprintGoal, OrgRoleCard, SystemCard, TaskSummary, WorkModeStep } from "../types";

export function ActionPill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="rounded-full border border-accent/40 bg-accent/12 px-4 py-2 text-sm text-accent transition hover:bg-accent/18"
      href={href}
    >
      {label}
    </Link>
  );
}

export function KeyStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/38">{title}</p>
      <p className="mt-3 text-base font-medium leading-7 text-white">{value}</p>
    </div>
  );
}

export function BulletBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/38">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-white/76">
          {items.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-white/60">{empty}</p>
      )}
    </div>
  );
}

export function TaskFocusList({ title, tasks, href, empty }: { title: string; tasks: TaskSummary[]; href: string; empty: string }) {
  return (
    <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-white/38">{title}</p>
        <Link href={href} className="text-xs text-accent transition hover:text-white">
          查看任务
        </Link>
      </div>
      {tasks.length > 0 ? (
        <div className="mt-4 space-y-3">
          {tasks.map((task) => (
            <Link
              key={task.path}
              href={`/knowledge-base?path=${encodeURIComponent(task.path)}`}
              className="block rounded-2xl border border-white/8 bg-black/20 px-3 py-3 transition hover:border-accent/30"
            >
              <p className="text-sm font-medium text-white">{task.title}</p>
              <p className="mt-2 text-sm leading-6 text-white/66">{task.goal}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-white/60">{empty}</p>
      )}
    </section>
  );
}

export function BlueprintGoalCard({ goal }: { goal: BlueprintGoal }) {
  return (
    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <p className="text-sm font-semibold text-white">{goal.title}</p>
      <div className="mt-4 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/38">发布标准</p>
          <ul className="mt-2 space-y-1.5 text-sm leading-6 text-white/72">
            {goal.releaseStandards.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
        {goal.relatedTasks.length > 0 ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/38">关联任务</p>
              <p className="mt-1 text-sm text-white/70">共 {goal.relatedTasks.length} 项，详细信息进入任务页查看。</p>
            </div>
            <Link href="/tasks" className="text-xs uppercase tracking-[0.2em] text-accent transition hover:text-white">
              查看任务
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function RoleCardCompact({ role }: { role: OrgRoleCard }) {
  return (
    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-accent">{role.name}</p>
      <p className="mt-3 text-sm leading-6 text-white/78">{role.mission}</p>
      {role.outputs.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/38">核心产物</p>
          <ul className="mt-2 space-y-1.5 text-sm leading-6 text-white/72">
            {role.outputs.slice(0, 2).map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <Link
        href="/knowledge-base?path=docs/ORG_MODEL.md"
        className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent transition hover:text-white"
      >
        查看职责
      </Link>
    </article>
  );
}

export function WorkModeFlowNode({ step, index }: { step: WorkModeStep; index: number }) {
  return (
    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium ${
            step.kind === "trigger"
              ? "border-accent/35 bg-accent/10 text-accent"
              : "border-white/12 bg-white/[0.05] text-white/78"
          }`}
        >
          {index + 1}
        </span>
        <p className="text-sm font-semibold tracking-[0.08em] text-white">{step.name}</p>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/74">{step.summary}</p>
      <Link
        href={step.href}
        className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent transition hover:text-white"
      >
        查看详情
      </Link>
    </article>
  );
}

export function LinkedSummaryCard({ item }: { item: SystemCard }) {
  return (
    <Link
      href={item.href}
      className="rounded-3xl border border-white/8 bg-white/[0.03] p-5 transition hover:border-accent/30 hover:bg-white/[0.05]"
    >
      <p className="text-xs uppercase tracking-[0.24em] text-accent">{item.title}</p>
      <p className="mt-3 text-sm leading-6 text-white/76">{item.summary}</p>
    </Link>
  );
}
