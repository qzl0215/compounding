import { Card } from "@/components/ui/card";
import { getDeliverySnapshot } from "@/modules/delivery";
import { DiffAwarePanel } from "@/modules/delivery/components/diff-aware-panel";
import { DEMAND_STAGE_HINTS, groupTaskRowsByDemandStage } from "@/modules/portal/stage-model";
import { DeliveryTable } from "@/modules/tasks/components/delivery-table";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const snapshot = await getDeliverySnapshot();
  const releaseDashboard = snapshot.facts.releaseDashboard;
  const rows = snapshot.projections.taskRows;
  const stages = groupTaskRowsByDemandStage(rows);
  const executionSummary = releaseDashboard.pending_dev_release
    ? `当前已有待验收 dev：${releaseDashboard.pending_dev_release.release_id}。先完成验收，不要继续横向扩散。`
    : stages.doing.length > 0
      ? `当前有 ${stages.doing.length} 条执行合同正在推进，先看阻塞和下一步。`
      : stages.ready.length > 0
        ? `当前有 ${stages.ready.length} 条合同已经成立，可以直接进入执行。`
        : "当前没有新的执行合同；边界没收清前，先留在待规划。";

  return (
    <div className="space-y-6">
      <section id="task-overview">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">执行判断</p>
          <h2 className="mt-3 text-3xl font-semibold">这页只回答一件事：哪些 task 真的能执行</h2>
          <p className="mt-4 max-w-4xl text-white/68">{executionSummary}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <StageStat title="待执行" value={String(stages.ready.length)} detail="执行合同已成立，可以直接推进。" />
            <StageStat title="执行中" value={String(stages.doing.length)} detail="只看推进、阻塞和风险。" />
            <StageStat title="待验收" value={String(stages.acceptance.length)} detail="结果已出，先按完成定义验收。" />
          </div>
          <div className="mt-5 rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-white/72">
            {stages.planning.length > 0
              ? `另外还有 ${stages.planning.length} 条规划类 task。它们还没形成执行合同，不应该挤进执行首屏。`
              : "当前没有额外规划类 task 抢占执行面板注意力。"}
          </div>
        </Card>
      </section>

      <section id="task-ready">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">待执行</p>
          <h3 className="mt-2 text-2xl font-semibold">执行合同已成立，现在可以开工</h3>
          <p className="mt-4 max-w-4xl text-white/68">{DEMAND_STAGE_HINTS.ready}</p>
          <div className="mt-5">
            <DeliveryTable
              rows={stages.ready}
              previewUrl={releaseDashboard.dev_preview_url}
              productionUrl={releaseDashboard.production_url}
              showControls={false}
              emptyText="当前没有待执行 task。合同没成立前，不要硬放进这里。"
            />
          </div>
        </Card>
      </section>

      <section id="task-doing">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">执行中</p>
          <h3 className="mt-2 text-2xl font-semibold">合同已经生效，只看推进与阻塞</h3>
          <p className="mt-4 max-w-4xl text-white/68">{DEMAND_STAGE_HINTS.doing}</p>
          <div className="mt-5">
            <DeliveryTable
              rows={stages.doing}
              previewUrl={releaseDashboard.dev_preview_url}
              productionUrl={releaseDashboard.production_url}
              showControls={false}
              emptyText="当前没有执行中的 task。"
            />
          </div>
        </Card>
      </section>

      <section id="task-acceptance">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">待验收</p>
          <h3 className="mt-2 text-2xl font-semibold">结果已经出来了，先按完成定义验收</h3>
          <p className="mt-4 max-w-4xl text-white/68">{DEMAND_STAGE_HINTS.acceptance}</p>
          <div className="mt-5">
            <DeliveryTable
              rows={stages.acceptance}
              previewUrl={releaseDashboard.dev_preview_url}
              productionUrl={releaseDashboard.production_url}
              showControls={false}
              emptyText="当前没有待验收 task。"
            />
          </div>
        </Card>
      </section>

      <section id="task-planning">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">待规划</p>
          <h3 className="mt-2 text-2xl font-semibold">这些 task 还没形成执行合同</h3>
          <p className="mt-4 max-w-4xl text-white/68">{DEMAND_STAGE_HINTS.planning}</p>
          <div className="mt-5">
            <DeliveryTable
              rows={stages.planning}
              previewUrl={releaseDashboard.dev_preview_url}
              productionUrl={releaseDashboard.production_url}
              showControls={false}
              emptyText="当前没有规划类 task。若事情还在讨论范围和成功标准，先留在 roadmap / operating-blueprint。"
            />
          </div>
        </Card>
      </section>

      <section id="task-diff-aware">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">第二屏：差异感知摘要</p>
          <h3 className="mt-2 text-2xl font-semibold">细节工具放到这里，不抢执行首屏</h3>
          <p className="mt-4 max-w-4xl text-white/68">
            diff、review、retro 和 ship log 仍然保留，但它们属于“已经决定进这页后才需要看的细节”。
          </p>
          <div className="mt-5">
            <DiffAwarePanel artifact={snapshot.facts.diffAware} variant="compact" />
          </div>
        </Card>
      </section>

      <section id="task-released">
        <details className="rounded-3xl border border-white/8 bg-panel/70 p-5 shadow-glow backdrop-blur-xl">
          <summary className="cursor-pointer text-sm font-medium text-white">展开已发布事项</summary>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/68">{DEMAND_STAGE_HINTS.released}</p>
          <div className="mt-5">
            <DeliveryTable
              rows={stages.released}
              previewUrl={releaseDashboard.dev_preview_url}
              productionUrl={releaseDashboard.production_url}
              showControls={false}
              emptyText="当前没有已发布 task。"
            />
          </div>
        </details>
      </section>
    </div>
  );
}

function StageStat({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/40">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/64">{detail}</p>
    </div>
  );
}
