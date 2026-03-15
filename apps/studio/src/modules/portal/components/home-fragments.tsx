import Link from "next/link";
import type { OrgRoleCard, SystemCard, TaskSummary } from "../types";

export function Pill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="rounded-full border border-accent/40 bg-accent/12 px-4 py-2 text-sm text-accent transition hover:bg-accent/18"
      href={href}
    >
      {label}
    </Link>
  );
}

export function InfoItem({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.24em] text-white/38">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/78">{value}</p>
    </div>
  );
}

export function BattleMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/38">{title}</p>
      <p className="mt-3 text-base font-medium leading-7 text-white">{value}</p>
    </div>
  );
}

export function BulletPanel({ title, items, empty }: { title: string; items: string[]; empty: string }) {
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

export function TaskList({
  title,
  tasks,
  href,
  empty,
}: {
  title: string;
  tasks: TaskSummary[];
  href: string;
  empty: string;
}) {
  return (
    <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-white/38">{title}</p>
        <Link href={href} className="text-xs text-accent transition hover:text-white">
          去任务页
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

export function RoleField({ title, items }: { title: string; items: string[] }) {
  return items.length > 0 ? (
    <div className="mt-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/38">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm leading-6 text-white/72">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  ) : null;
}

export function RoleCard({ role }: { role: OrgRoleCard }) {
  return (
    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-accent">{role.name}</p>
      <p className="mt-3 text-sm leading-6 text-white/78">{role.mission}</p>
      <RoleField title="主要职责" items={role.responsibilities} />
      <RoleField title="主要产物" items={role.outputs} />
      <RoleField title="何时介入" items={role.triggerMoments} />
      <RoleField title="不该做什么" items={role.antiPatterns} />
    </article>
  );
}

export function LinkedCard({ item }: { item: SystemCard }) {
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
