import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/card";
import { readDoc } from "@/modules/docs";
import { getGitHead, getGitStatus, getLatestPreMutationCheck } from "@/modules/git-health";
import { extractSection, formatSyncStatus, formatWorktreeStatus, HOME_ENTRY_LINKS } from "@/modules/portal";

export default async function HomePage() {
  const [agents, currentState, roadmap, currentTask] = await Promise.all([
    readDoc("AGENTS.md"),
    readDoc("memory/project/current-state.md"),
    readDoc("memory/project/roadmap.md"),
    readDoc("tasks/queue/task-001-repo-refactor.md")
  ]);
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
          <p className="text-xs uppercase tracking-[0.28em] text-accent">当前状态</p>
          <h3 className="text-2xl font-semibold">项目状态镜像</h3>
          <SectionMarkdown content={currentState.content} empty="当前状态区块暂未生成。" />
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.62fr_0.38fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">执行协议</p>
          <h3 className="mt-2 text-2xl font-semibold">硬约束</h3>
          <SectionMarkdown content={extractSection(agents.content, "Hard Rules")} empty="硬约束区块暂未生成。" />
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
          <p className="text-xs uppercase tracking-[0.28em] text-accent">路线图</p>
          <SectionMarkdown content={roadmap.content} empty="roadmap 当前主线暂未生成。" />
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">当前任务</p>
          <SectionMarkdown content={currentTask.content} empty="任务队列暂未生成。" />
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.56fr_0.44fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">必读清单</p>
          <SectionMarkdown content={extractSection(agents.content, "Required Reads")} empty="必读清单区块暂未生成。" />
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">默认工作顺序</p>
          <SectionMarkdown content={extractSection(agents.content, "Working Order")} empty="工作顺序区块暂未生成。" />
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

function SectionMarkdown({ content, empty }: { content: string | null; empty: string }) {
  return content ? (
    <div className="prose prose-invert mt-4 max-w-none prose-p:text-white/78 prose-li:text-white/78 prose-strong:text-white prose-code:text-accent">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  ) : (
    <p className="mt-4 text-sm text-white/60">{empty}</p>
  );
}
