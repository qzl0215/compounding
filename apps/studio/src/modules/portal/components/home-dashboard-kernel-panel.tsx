import { Card } from "@/components/ui/card";
import type { ProjectOverviewSnapshot, UpgradeFlowStep } from "../types";
import { EntryTile, GovernanceTile, SectionHeader, ToneBadge } from "./home-fragments";

export function KernelPanel({ overview }: { overview: ProjectOverviewSnapshot }) {
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

function InfoTile({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "accent" | "warning" }) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/42">{label}</p>
      <p className={tone === "accent" ? "mt-3 text-2xl font-semibold text-accent" : tone === "warning" ? "mt-3 text-2xl font-semibold text-amber-200" : "mt-3 text-2xl font-semibold text-white"}>
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
