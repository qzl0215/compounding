import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getDeliverySnapshot } from "@/modules/delivery";
import { DeliveryTable } from "@/modules/tasks/components/delivery-table";
import { buildSubtaskTableRows } from "@/modules/tasks/subtask-table";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const snapshot = await getDeliverySnapshot();
  const releaseDashboard = snapshot.facts.releaseDashboard;
  const rows = buildSubtaskTableRows(snapshot.projections.taskRows);
  const activeCount = rows.filter((row) => row.deliveryStatus === "in_progress").length;
  const pendingAcceptanceCount = rows.filter((row) => row.deliveryStatus === "pending_acceptance").length;
  const blockedCount = rows.filter((row) => row.deliveryStatus === "blocked").length;

  return (
    <div className="space-y-6">
      <section id="task-list">
        <PageHeader
          eyebrow="执行面板"
          title="子任务清单"
          description="只保留当前子任务。已发布历史下沉到发布页，不在这里重复平铺。"
          note="当你需要判断下一步做什么时，先看这里；当你需要看版本结果时，再去发布页。"
          metrics={[
            {
              label: "当前子任务",
              value: `${rows.length} 项`,
              tone: "accent",
            },
            {
              label: "进行中",
              value: `${activeCount} 项`,
              tone: activeCount > 0 ? "warning" : "success",
            },
            {
              label: "待验收",
              value: `${pendingAcceptanceCount} 项`,
              tone: pendingAcceptanceCount > 0 ? "warning" : "default",
            },
            {
              label: "已阻塞",
              value: `${blockedCount} 项`,
              tone: blockedCount > 0 ? "danger" : "success",
            },
          ]}
          />
        </section>

      <section id="task-table">
        <Card className="p-4 lg:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-sky-700">子任务列表</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">只保留当前需要推进的事项，交付历史通过发布页追溯。</p>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              这里默认不堆额外面板，只保留最必要的执行信息，避免把“做什么”又做回一张复杂工单。
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
