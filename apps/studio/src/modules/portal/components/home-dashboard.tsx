"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/classnames";
import type { HomeTabId, ProjectOverviewSnapshot, ProjectStepStatus, UpgradeFlowStep } from "../types";
import { BoundaryTile, EntryTile, GovernanceTile, MetricTile, ToneBadge } from "./home-fragments";

const TABS: Array<{ id: HomeTabId; label: string; description: string }> = [
  { id: "project", label: "Project", description: "当前仓库的接入状态、执行态势和边界。" },
  { id: "kernel", label: "Kernel", description: "跨项目复用的 AI 工程规范和升级路径。" },
];

export function HomeDashboard({ overview }: { overview: ProjectOverviewSnapshot }) {
  const [activeTab, setActiveTab] = useState<HomeTabId>(overview.defaultTab);

  return (
    <div className="space-y-6">
      <section id="home-surface">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs uppercase tracking-[0.32em] text-accent">{overview.header.eyebrow}</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight">{overview.header.title}</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-white/72">{overview.header.description}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <ToneBadge tone="accent">{overview.header.workspaceLabel}</ToneBadge>
                <span className="break-all font-mono text-xs text-white/48">{overview.header.workspacePath}</span>
              </div>
            </div>
            <div className="w-full max-w-[420px]">
              <div
                role="tablist"
                aria-label="首页视图"
                className="grid grid-cols-2 gap-2 rounded-[1.75rem] border border-white/8 bg-black/25 p-2"
              >
                {TABS.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      id={`${tab.id}-tab`}
                      role="tab"
                      aria-selected={active}
                      aria-controls={`${tab.id}-panel`}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "relative overflow-hidden rounded-[1.2rem] px-4 py-4 text-left transition",
                        active ? "text-white" : "text-white/60 hover:text-white",
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="home-tab-surface"
                          className="absolute inset-0 rounded-[1.2rem] border border-accent/30 bg-accent/12"
                          transition={{ type: "spring", stiffness: 320, damping: 34 }}
                        />
                      ) : null}
                      <span className="relative block text-xs uppercase tracking-[0.24em] text-white/40">{tab.label}</span>
                      <span className="relative mt-2 block text-sm leading-6">{tab.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section id="home-tab-panel">
        {activeTab === "project" ? (
          <ProjectPanel overview={overview} />
        ) : (
          <KernelPanel overview={overview} />
        )}
      </section>
    </div>
  );
}

function ProjectPanel({ overview }: { overview: ProjectOverviewSnapshot }) {
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

function KernelPanel({ overview }: { overview: ProjectOverviewSnapshot }) {
  const { kernel } = overview;
  return (
    <div id="kernel-panel" role="tabpanel" aria-labelledby="kernel-tab" className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <SectionHeader eyebrow="内核身份" title="AI 工程规范" description={kernel.identity.summary} />
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <InfoTile label="kernel version" value={kernel.identity.version} tone="accent" />
            <InfoTile label="current adoption" value={kernel.identity.currentAdoptionMode} tone="warning" />
          </div>
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.22em] text-white/42">supported modes</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {kernel.identity.supportedModes.map((mode) => (
                <ToneBadge key={mode} tone={mode === kernel.identity.currentAdoptionMode ? "accent" : "default"}>
                  {mode}
                </ToneBadge>
              ))}
            </div>
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/42">manifest</p>
            <p className="mt-3 break-all font-mono text-xs leading-6 text-white/62">{kernel.identity.manifestPath}</p>
            <p className="mt-3 text-sm leading-6 text-white/52">
              {kernel.sourceHealth.manifest ? "kernel manifest 已落地。" : "当前仓库尚未提交 kernel manifest，首页按缺失态呈现。"}
            </p>
          </div>
        </Card>

        <Card>
          <SectionHeader eyebrow="规范入口" title="canonical entry points" description="Kernel 板块只展示高频规范入口，不在首页平铺逐文件台账。" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {kernel.entryPoints.map((entry) => (
              <EntryTile key={entry.label} entry={entry} />
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader eyebrow="内核治理" title="managed / shell / protected / generated" description="这里显示当前仓库中 kernel/shell 资产摘要，以及报告声明和仓库实物是否一致。" />
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {kernel.governance.map((bucket) => (
            <GovernanceTile key={bucket.id} bucket={bucket} />
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader eyebrow="升级路径" title="bootstrap → attach → audit → proposal" description="Kernel 视图只解释标准升级闭环，不承接当前项目的实时执行细节。" />
        <div className="mt-6 grid gap-4 xl:grid-cols-4">
          {kernel.upgradeFlow.map((step) => (
            <UpgradeStepTile key={step.id} step={step} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.24em] text-accent">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold">{title}</h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-white/66">{description}</p>
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

function InfoTile({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "accent" | "warning" }) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/42">{label}</p>
      <p className={cn("mt-3 text-2xl font-semibold text-white", tone === "accent" ? "text-accent" : tone === "warning" ? "text-amber-200" : "")}>
        {value}
      </p>
    </div>
  );
}

function UpgradeStepTile({ step }: { step: UpgradeFlowStep }) {
  return (
    <article className="rounded-[1.5rem] border border-white/8 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-white/42">{step.label}</p>
      <p className="mt-3 text-xl font-semibold text-white">{step.summary}</p>
      <p className="mt-4 text-sm leading-6 text-white/62">{step.detail}</p>
    </article>
  );
}
