import { PageOutline } from "@/components/page-outline";
import { Card } from "@/components/ui/card";
import { getReleaseDashboard } from "@/modules/releases";
import { buildTaskDeliveryRows, listTaskCards } from "@/modules/tasks";
import { DeliveryTable } from "@/modules/tasks/components/delivery-table";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const releaseDashboard = getReleaseDashboard();
  const tasks = await listTaskCards();
  const rows = buildTaskDeliveryRows(tasks, releaseDashboard.releases);
  const outline = [{ id: "task-overview", label: "任务总览" }, { id: "task-delivery-table", label: "交付摘要表" }];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="space-y-6">
        <section id="task-overview">
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">任务清单</p>
            <h2 className="mt-3 text-3xl font-semibold">任务与交付批次摘要</h2>
            <p className="mt-4 max-w-4xl text-white/68">
              这里是统一驾驶舱下的任务详情页。首页先回答“当前最重要的事”和“现在卡在哪”，进入这里后再展开 task 的收益、
              风险、交付状态和执行明细。
            </p>
            <div className="mt-5 rounded-3xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white/72">
              {releaseDashboard.pending_dev_release
                ? `当前存在未验收 dev：${releaseDashboard.pending_dev_release.release_id}。请先验收上一个 dev，再继续出新预览。`
                : "当前没有待验收 dev；完成一轮可验收改动后，应先生成 dev 预览链接。"}
            </div>
          </Card>
        </section>
        <section id="task-delivery-table">
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">交付摘要表</p>
            <h3 className="mt-2 text-2xl font-semibold">默认看收益、风险、状态、版本与可介入动作</h3>
            <p className="mt-4 max-w-4xl text-white/68">
              这里继续保留 release 是验收与回滚边界、task 是执行边界的事实，但先把最值得人工判断的信息放在默认视图里。
            </p>
            <div className="mt-5">
              <DeliveryTable rows={rows} previewUrl={releaseDashboard.dev_preview_url} productionUrl={releaseDashboard.production_url} />
            </div>
          </Card>
        </section>
      </div>
      <PageOutline items={outline} />
    </div>
  );
}
