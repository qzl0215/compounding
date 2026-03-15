import Link from "next/link";
import { Card } from "@/components/ui/card";
import { MarkdownContent } from "@/modules/docs";
import { getGitHead, getGitStatus, getLatestPreMutationCheck } from "@/modules/git-health";
import { formatSyncStatus, formatWorktreeStatus, getPortalOverview, HOME_ENTRY_LINKS } from "@/modules/portal";

export default async function HomePage() {
  const overview = await getPortalOverview();
  const gitHead = getGitHead();
  const gitStatus = getGitStatus();
  const latestCheck = getLatestPreMutationCheck();

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.32em] text-accent">首页</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight">唯一主源是 <code>AGENTS.md</code>。</h2>
          <p className="mt-4 max-w-3xl text-lg text-white/68">
            当前仓库已经收口成 AI-Native Repo。入口规则在 <code>AGENTS.md</code>，详细规则、架构、工作流和 AI operating model 落在
            <code>docs/*</code>，项目状态、经验和 ADR 落在 <code>memory/*</code>，上下文入口落在 <code>code_index/*</code> 和
            <code>tasks/*</code>。
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {HOME_ENTRY_LINKS.map((entry) => (
              <Pill key={entry.scope} href={entry.href} label={entry.label} />
            ))}
          </div>
        </Card>
        <Card className="space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">项目介绍</p>
          <h3 className="text-2xl font-semibold">主源压缩镜像</h3>
          <SectionContent content={overview.projectIntro} empty="项目介绍区块暂未生成。" />
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.62fr_0.38fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">当前主线</p>
          <h3 className="mt-2 text-2xl font-semibold">路线图与当前焦点</h3>
          <SectionContent content={overview.currentFocus} empty="当前焦点区块暂未生成。" />
          <SectionContent className="mt-6" content={overview.roadmap} empty="roadmap 当前主线暂未生成。" />
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">改动前检查</p>
          <h3 className="mt-2 text-2xl font-semibold">Git 当前状态</h3>
          <div className="mt-4 space-y-3 text-sm text-white/72">
            <p>当前 HEAD：{gitHead || "未提交"}</p>
            <p>工作区状态：{formatWorktreeStatus(gitStatus)}</p>
            {latestCheck ? (
              <>
                <p>最近一次检查：{formatSyncStatus(latestCheck.sync_status)}</p>
                <p>下一步动作：{latestCheck.next_action}</p>
              </>
            ) : (
              <p>还没有最近一次 preflight 记录。改动前运行 `python3 scripts/pre_mutation_check.py`。</p>
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.56fr_0.44fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">当前待办</p>
          <div className="mt-4 grid gap-4">
            {overview.tasks.length > 0 ? (
              overview.tasks.map((task) => (
                <Link
                  key={task.path}
                  href={`/knowledge-base?path=${encodeURIComponent(task.path)}`}
                  className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-accent/30 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-accent">{task.status}</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{task.title}</h3>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/62">任务</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/72">{task.goal}</p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-white/60">当前没有可视化任务。</p>
            )}
          </div>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">记忆与决策</p>
          <div className="mt-4 space-y-4">
            {overview.memory.map((entry) => (
              <PreviewCard key={entry.path} entry={entry} />
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.56fr_0.44fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">项目索引</p>
          <div className="mt-4 space-y-4">
            {overview.index.map((entry) => (
              <PreviewCard key={entry.path} entry={entry} />
            ))}
          </div>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">代理职责</p>
          <SectionContent content={overview.roleOverview} empty="职责区块暂未生成。" />
        </Card>
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

function SectionContent({ content, empty, className }: { content: string | null; empty: string; className?: string }) {
  return content ? (
    <MarkdownContent className={className ?? "mt-4"} compact content={content} />
  ) : (
    <p className={className ? `${className} text-sm text-white/60` : "mt-4 text-sm text-white/60"}>{empty}</p>
  );
}

function PreviewCard({ entry }: { entry: { label: string; path: string; content: string } }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-accent">{entry.label}</p>
      <Link
        href={`/knowledge-base?path=${encodeURIComponent(entry.path)}`}
        className="mt-2 inline-flex items-center gap-2 font-mono text-[11px] text-white/38 transition hover:text-accent"
      >
        {entry.path}
      </Link>
      <MarkdownContent className="mt-4" compact content={entry.content} />
    </div>
  );
}
