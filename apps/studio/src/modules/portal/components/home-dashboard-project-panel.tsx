import { Card } from "@/components/ui/card";
import type { ProjectOverviewSnapshot, ProjectStepStatus } from "../types";
import { BoundaryTile, EntryTile, MetricTile, SectionHeader, ToneBadge } from "./home-fragments";

export function ProjectPanel({ overview }: { overview: ProjectOverviewSnapshot }) {
  const { project } = overview;
  return (
    <div id="project-panel" role="tabpanel" aria-labelledby="project-tab" className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <Card>
          <SectionHeader eyebrow="项目身份" title={project.identity.name} description={project.identity.oneLiner} />
          <div className="mt-5 flex flex-wrap gap-3">
            <ToneBadge tone="warning">{project.identity.adoptionMode}</ToneBadge>
            <ToneBadge tone="accent">{project.identity.kernelVersion}</ToneBadge>
          </div>
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.22em] text-white/42">success criteria</p>
            {project.identity.successCriteria.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {project.identity.successCriteria.map((item) => (
                  <li key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/76">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-6 text-white/52">当前还没有写入 success criteria。</p>
            )}
          </div>
        </Card>

        <Card>
          <SectionHeader eyebrow="执行态势" title="当前判断" description={project.execution.summary} />
          <div className="mt-6 grid gap-4">
            {project.execution.metrics.map((item) => (
              <MetricTile key={item.label} item={item} />
            ))}
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/42">pending dev</p>
            <p className="mt-3 text-sm leading-6 text-white/74">{project.execution.pendingDevSummary}</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <SectionHeader eyebrow="内核接入状态" title="attach / audit / proposal" description={project.kernelStatus.summary} />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {project.kernelStatus.steps.map((step) => (
              <StepTile key={step.id} step={step} />
            ))}
          </div>
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/42">attach score</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {project.kernelStatus.attachScore !== null ? project.kernelStatus.attachScore : "N/A"}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/42">proposal summary</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ToneBadge tone="success">auto {project.kernelStatus.proposal.autoApplyCount}</ToneBadge>
                <ToneBadge tone="warning">suggest {project.kernelStatus.proposal.suggestOnlyCount}</ToneBadge>
                <ToneBadge tone="danger">blocked {project.kernelStatus.proposal.blockedCount}</ToneBadge>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/64">
                {project.kernelStatus.proposal.proposalId
                  ? `proposal_id ${project.kernelStatus.proposal.proposalId}，conflicts ${project.kernelStatus.proposal.conflictCount}。`
                  : "当前还没有 proposal 产物。"}
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            <ArtifactRow label="brief" path={project.kernelStatus.artifactPaths.brief} ready={project.kernelStatus.artifactHealth.brief} />
            <ArtifactRow label="report" path={project.kernelStatus.artifactPaths.report} ready={project.kernelStatus.artifactHealth.report} />
            <ArtifactRow label="proposal" path={project.kernelStatus.artifactPaths.proposal} ready={project.kernelStatus.artifactHealth.proposal} />
          </div>
        </Card>

        <Card>
          <SectionHeader eyebrow="运行与边界" title="项目边界" description="项目板块只看当前仓库的 owned/protected/boundary，而不是把它们重新抽象回 kernel。" />
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {project.boundaryGroups.map((group) => (
              <BoundaryTile key={group.label} group={group} />
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <SectionHeader eyebrow="运行信号" title="dev / production" description={overview.runtimeFacts.summary} />
          <div className="mt-6 grid gap-4">
            {project.execution.runtimeSignals.map((signal) => (
              <EntryTile
                key={signal.label}
                entry={{
                  label: signal.label,
                  description: `${signal.status} · ${signal.summary}`,
                  href: signal.href,
                  tone: signal.label === "production" ? "warning" : "accent",
                }}
              />
            ))}
          </div>
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <CompactList title="next checkpoint" items={project.execution.nextCheckpoint} emptyText="当前未写入下一检查点。" />
            <CompactList title="blocked" items={project.execution.blockedItems} emptyText="当前没有显式阻塞项。" />
          </div>
        </Card>

        <Card>
          <SectionHeader eyebrow="下钻入口" title="继续去哪里" description="首页只给判断和定位；具体执行、证据和发布动作继续留在各自页面。" />
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {project.drilldowns.map((entry) => (
              <EntryTile key={`${entry.label}-${entry.path || entry.href || "entry"}`} entry={entry} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StepTile({ step }: { step: ProjectStepStatus }) {
  return (
    <article className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-white/42">{step.label}</p>
        <ToneBadge tone={step.tone}>{step.statusLabel}</ToneBadge>
      </div>
      <p className="mt-3 text-lg font-semibold text-white">{step.state}</p>
      <p className="mt-3 text-sm leading-6 text-white/64">{step.summary}</p>
    </article>
  );
}

function ArtifactRow({ label, path, ready }: { label: string; path: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.18em] text-white/42">{label}</p>
        <p className="mt-2 break-all font-mono text-[11px] leading-5 text-white/60">{path}</p>
      </div>
      <ToneBadge tone={ready ? "success" : "danger"}>{ready ? "ready" : "missing"}</ToneBadge>
    </div>
  );
}

function CompactList({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/42">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm leading-6 text-white/70">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm leading-6 text-white/52">{emptyText}</p>
      )}
    </div>
  );
}
