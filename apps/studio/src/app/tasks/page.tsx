import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getDeliverySnapshot } from "@/modules/delivery";
import { HarnessBoard } from "@/modules/harness";
import { getProjectStateSnapshot, ProjectJudgementStrip } from "@/modules/project-state";
import { DeliveryTable } from "@/modules/tasks/components/delivery-table";
import { buildSubtaskTableRows } from "@/modules/tasks/subtask-table";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const snapshot = await getDeliverySnapshot();
  const projectState = await getProjectStateSnapshot({ deliverySnapshot: snapshot });
  const releaseDashboard = snapshot.facts.releaseDashboard;
  const rows = buildSubtaskTableRows(snapshot.projections.taskRows);
  const activeCount = rows.filter((row) => row.deliveryStatus === "in_progress").length;
  const pendingAcceptanceCount = rows.filter((row) => row.deliveryStatus === "pending_acceptance").length;
  const blockedCount = rows.filter((row) => row.deliveryStatus === "blocked").length;
  const cleanupScheduledCount = projectState.execution.cleanup.scheduled;
  const cleanupFailedCount = projectState.execution.cleanup.failed;
  const cleanupOverdueCount = projectState.execution.cleanup.overdue;

  return (
    <div className="space-y-6">
      <section id="task-list">
        <PageHeader
          eyebrow="执行面板"
          title="子任务清单"
          description={projectState.execution.summary}
          note={projectState.focus.summary}
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
              value: projectState.release.pendingAcceptance || `${pendingAcceptanceCount} 项`,
              tone: pendingAcceptanceCount > 0 ? "warning" : "default",
            },
            {
              label: "已阻塞",
              value: `${blockedCount} 项`,
              tone: blockedCount > 0 ? "danger" : "success",
            },
            {
              label: "待回收",
              value: `${cleanupScheduledCount} 项`,
              tone: cleanupScheduledCount > 0 ? "warning" : "default",
            },
            {
              label: "回收失败",
              value: `${cleanupFailedCount} 项`,
              tone: cleanupFailedCount > 0 ? "danger" : "success",
            },
            {
              label: "逾期未回收",
              value: `${cleanupOverdueCount} 项`,
              tone: cleanupOverdueCount > 0 ? "danger" : "success",
            },
          ]}
        />
      </section>

      <section id="task-judgement">
        <ProjectJudgementStrip judgement={projectState.judgement} />
      </section>

      <section id="task-harness">
        <HarnessBoard snapshot={snapshot.facts.harness} compact />
      </section>

      <section id="task-table">
        <Card className="p-4 lg:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-sky-700">子任务列表</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">只保留当前需要推进的事项；计划边界看运营蓝图，交付历史看发布页。</p>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              {projectState.execution.cleanup.alert
                ? projectState.execution.cleanup.alert
                : projectState.release.pendingAcceptance
                ? `${projectState.release.pendingAcceptance}，先做判断再继续推进。`
                : "这里默认不堆额外面板，只保留最必要的执行信息，避免把“做什么”又做回一张复杂工单。"}
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
