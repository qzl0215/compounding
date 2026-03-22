import { PageOutline } from "@/components/page-outline";
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
  const outline = [
    { id: "task-overview", label: "执行总览" },
    { id: "task-planning", label: "待规划" },
    { id: "task-ready", label: "待执行" },
    { id: "task-doing", label: "执行中" },
    { id: "task-acceptance", label: "待验收" },
    { id: "task-released", label: "已发布" },
    { id: "task-diff-aware", label: "差异感知产物" },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="space-y-6">
        <section id="task-overview">
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">执行面板</p>
            <h2 className="mt-3 text-3xl font-semibold">先分清规划、执行、验收，再看 task</h2>
            <p className="mt-4 max-w-4xl text-white/68">
              这里不再把所有 task 混在一起看。规划类 task 留在待规划；只有真正具备执行边界的事项，才进入待执行和执行中。
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-5">
              <StageStat title="待规划" value={String(stages.planning.length)} />
              <StageStat title="待执行" value={String(stages.ready.length)} />
              <StageStat title="执行中" value={String(stages.doing.length)} />
              <StageStat title="待验收" value={String(stages.acceptance.length)} />
              <StageStat title="已发布" value={String(stages.released.length)} />
            </div>
            <div className="mt-5 rounded-3xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white/72">
              {releaseDashboard.pending_dev_release
                ? `当前存在未验收 dev：${releaseDashboard.pending_dev_release.release_id}。请先验收上一个 dev，再继续出新预览。`
                : "当前没有待验收 dev；完成一轮可验收改动后，应先生成 dev 预览链接。"}
            </div>
          </Card>
        </section>
        <section id="task-planning">
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">待规划</p>
            <h3 className="mt-2 text-2xl font-semibold">这些 task 还在收口边界，不该直接开工</h3>
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
        <section id="task-ready">
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">待执行</p>
            <h3 className="mt-2 text-2xl font-semibold">边界已经说清，现在可以进 task 推进</h3>
            <p className="mt-4 max-w-4xl text-white/68">{DEMAND_STAGE_HINTS.ready}</p>
            <div className="mt-5">
              <DeliveryTable
                rows={stages.ready}
                previewUrl={releaseDashboard.dev_preview_url}
                productionUrl={releaseDashboard.production_url}
                showControls={false}
                emptyText="当前没有待执行 task。若边界还没说清，不要硬放进这里。"
              />
            </div>
          </Card>
        </section>
        <section id="task-doing">
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">执行中</p>
            <h3 className="mt-2 text-2xl font-semibold">已经开工的事情，只看推进与阻塞</h3>
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
            <h3 className="mt-2 text-2xl font-semibold">结果已经出来了，先判断通过还是驳回</h3>
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
        <section id="task-released">
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">已发布</p>
            <h3 className="mt-2 text-2xl font-semibold">这些已经交付完成，默认不抢首屏注意力</h3>
            <p className="mt-4 max-w-4xl text-white/68">{DEMAND_STAGE_HINTS.released}</p>
            <div className="mt-5">
              <DeliveryTable
                rows={stages.released}
                previewUrl={releaseDashboard.dev_preview_url}
                productionUrl={releaseDashboard.production_url}
                showControls={false}
                emptyText="当前没有已发布 task。"
              />
            </div>
          </Card>
        </section>
        <section id="task-diff-aware">
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">差异感知 QA / Review / Retro</p>
            <h3 className="mt-2 text-2xl font-semibold">根据当前 diff 给出最小验证与复盘线索</h3>
            <p className="mt-4 max-w-4xl text-white/68">
              这里不新增一套评估平台，只把当前改动的范围、风险、建议检查和复盘线索收拢成同一份派生摘要，方便先看再决定是否介入。
            </p>
            <div className="mt-5">
              <DiffAwarePanel artifact={snapshot.facts.diffAware} variant="compact" />
            </div>
          </Card>
        </section>
      </div>
      <PageOutline items={outline} />
    </div>
  );
}

function StageStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/40">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
