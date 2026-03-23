import { Card } from "@/components/ui/card";
import { getDeliverySnapshot } from "@/modules/delivery";
import { DeliveryTable } from "@/modules/tasks/components/delivery-table";
import { buildSubtaskTableRows } from "@/modules/tasks/subtask-table";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const snapshot = await getDeliverySnapshot();
  const releaseDashboard = snapshot.facts.releaseDashboard;
  const rows = buildSubtaskTableRows(snapshot.projections.taskRows);

  return (
    <div>
      <section id="task-list">
        <Card>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-accent">子任务</p>
              <h2 className="mt-3 text-3xl font-semibold">子任务清单</h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-white/62">
              只保留当前子任务。已发布历史下沉到发布页，不在这里重复平铺。
            </p>
          </div>
          <div className="mt-5">
            <DeliveryTable
              rows={rows}
              previewUrl={releaseDashboard.dev_preview_url}
              productionUrl={releaseDashboard.production_url}
              showControls={false}
              emptyText="当前没有需要处理的子任务。"
            />
          </div>
        </Card>
      </section>
    </div>
  );
}
