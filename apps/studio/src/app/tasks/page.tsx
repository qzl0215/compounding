import Link from "next/link";
import { PageOutline } from "@/components/page-outline";
import { Card } from "@/components/ui/card";
import { getTaskBoard, TASK_STATUS_LABELS } from "@/modules/tasks";

export default async function TasksPage() {
  const board = await getTaskBoard();
  const outline = [
    { id: "task-overview", label: "任务总览" },
    ...board.map((group) => ({ id: `task-${group.status}`, label: TASK_STATUS_LABELS[group.status] })),
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="space-y-6">
        <section id="task-overview">
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">任务</p>
            <h2 className="mt-3 text-3xl font-semibold">轻量项目管理清单</h2>
            <p className="mt-4 max-w-4xl text-white/68">
              每次可合并改动都绑定一个 task。task 负责记录目标、范围、风险和更新痕迹，而不是扩成重型工单系统。
            </p>
          </Card>
        </section>

        {board.map((group) => (
          <section id={`task-${group.status}`} key={group.status}>
            <Card>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-accent">任务状态</p>
                  <h3 className="mt-2 text-2xl font-semibold">{group.label}</h3>
                </div>
                <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-xs text-white/62">{group.tasks.length} 项</span>
              </div>
              <div className="mt-5 grid gap-4">
                {group.tasks.length > 0 ? (
                  group.tasks.map((task) => (
                    <article key={task.path} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-accent">{task.status}</p>
                          <h4 className="mt-2 text-lg font-semibold text-white">{task.title}</h4>
                        </div>
                        <Link
                          href={`/knowledge-base?path=${encodeURIComponent(task.path)}`}
                          className="rounded-full border border-white/12 bg-black/20 px-3 py-1 text-xs text-white/72 transition hover:border-accent/35 hover:text-white"
                        >
                          打开任务
                        </Link>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-white/72">{task.goal}</p>
                      {task.relatedModules.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {task.relatedModules.map((modulePath) => (
                            <span
                              key={modulePath}
                              className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/62"
                            >
                              {modulePath}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <dl className="mt-4 grid gap-3 text-sm text-white/68 md:grid-cols-2">
                        <TraceItem title="记忆" value={task.updateTrace.memory} />
                        <TraceItem title="索引" value={task.updateTrace.index} />
                        <TraceItem title="路线图" value={task.updateTrace.roadmap} />
                        <TraceItem title="文档" value={task.updateTrace.docs} />
                      </dl>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-white/58">当前没有该状态的任务。</p>
                )}
              </div>
            </Card>
          </section>
        ))}
      </div>
      <PageOutline items={outline} />
    </div>
  );
}

function TraceItem({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
      <dt className="text-xs uppercase tracking-[0.22em] text-white/40">{title}</dt>
      <dd className="mt-2 text-white/78">{value}</dd>
    </div>
  );
}
