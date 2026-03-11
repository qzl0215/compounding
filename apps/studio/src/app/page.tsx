import Link from "next/link";
import { Card } from "@/components/ui/card";
import { readProjectBrief, readResolvedBootstrapConfig } from "@/lib/config";
import { listProposalBundles } from "@/lib/proposals";

export default async function HomePage() {
  const [brief, resolved, proposals] = await Promise.all([
    readProjectBrief(),
    readResolvedBootstrapConfig(),
    listProposalBundles()
  ]);

  const latestReview = proposals[0]?.reviewSummary;
  const roles = resolved?.org_structure.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="overflow-hidden">
          <p className="text-xs uppercase tracking-[0.32em] text-accent">Home</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight">
            {brief.project_name} 让小白用户也能用专业方式启动项目、发任务、审关键变更。
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-white/68">{brief.project_one_liner}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Pill href="/initialize" label="初始化项目" />
            <Pill href="/tasks" label="新建任务" />
            <Pill href="/reviews" label="查看 Reviews" />
          </div>
        </Card>

        <Card className="space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Project Card</p>
          <h3 className="text-2xl font-semibold">一页项目作战卡</h3>
          <Stat label="Success Definition" value={brief.success_definition} />
          <Stat label="Current Priority" value={brief.current_priority} />
          <Stat label="Runtime Boundary" value={brief.runtime_boundary} />
          <Stat label="Must Protect" value={brief.must_protect.join(" / ")} />
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.62fr_0.38fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Recommended Next Step</p>
          <h3 className="mt-2 text-2xl font-semibold">先做最有 ROI 的一件事</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ActionCard
              description="如果你还没确认项目作战卡，先完成 5 个问题的初始化。"
              href="/initialize"
              title="完成初始化"
            />
            <ActionCard
              description="如果项目边界已经清楚，直接把任务目标交给系统，让它帮你补齐上下文与约束。"
              href="/tasks"
              title="创建第一个任务"
            />
          </div>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Latest Review</p>
          <h3 className="mt-2 text-2xl font-semibold">最近待确认变更</h3>
          {latestReview ? (
            <div className="mt-4 space-y-3 text-sm text-white/72">
              <p>{latestReview.goal}</p>
              <p>{latestReview.impact_summary}</p>
              <p>risk: {latestReview.risk_level}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/60">当前还没有待确认 review。</p>
          )}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <details className="group rounded-3xl border border-line/80 bg-panel/70 p-5 shadow-glow backdrop-blur-xl">
          <summary className="cursor-pointer list-none text-sm font-medium text-white/85">规则摘要</summary>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>系统会自动要求关键改动先 review 后写入。</li>
            <li>Git 文件是唯一真相源。</li>
            <li>当证据不足时，系统必须缩小结论边界。</li>
          </ul>
        </details>
        <details className="group rounded-3xl border border-line/80 bg-panel/70 p-5 shadow-glow backdrop-blur-xl">
          <summary className="cursor-pointer list-none text-sm font-medium text-white/85">角色摘要</summary>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            {roles.length > 0 ? (
              roles.map((role) => (
                <li key={role.role}>
                  <span className="font-medium text-white">{role.role}</span>
                  <span className="ml-2 text-white/58">{role.responsibilities[0]}</span>
                </li>
              ))
            ) : (
              <li>尚未生成 resolved config。完成初始化后这里会显示系统内部角色。</li>
            )}
          </ul>
        </details>
        <details className="group rounded-3xl border border-line/80 bg-panel/70 p-5 shadow-glow backdrop-blur-xl">
          <summary className="cursor-pointer list-none text-sm font-medium text-white/85">最近记忆</summary>
          <div className="mt-4 space-y-2 text-sm text-white/70">
            <p>系统会把被采纳的变更写入 `docs/MEMORY_LEDGER.md`。</p>
            <p>只有值得长期保留的经验，才会继续收敛回 canonical content。</p>
          </div>
        </details>
      </section>
    </div>
  );
}

function Pill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="rounded-full border border-accent/40 bg-accent/12 px-4 py-2 text-sm text-accent transition hover:bg-accent/18"
      href={href}
    >
      {label}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-white/42">{label}</p>
      <p className="mt-2 text-sm leading-7 text-white/78">{value}</p>
    </div>
  );
}

function ActionCard({ description, href, title }: { description: string; href: string; title: string }) {
  return (
    <Link className="rounded-3xl border border-white/8 bg-white/[0.03] p-5 transition hover:border-accent/30 hover:bg-white/[0.05]" href={href}>
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mt-3 text-sm leading-7 text-white/66">{description}</p>
    </Link>
  );
}
