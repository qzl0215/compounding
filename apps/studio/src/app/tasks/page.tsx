import type { ReactNode } from "react";
import Link from "next/link";
import { PageOutline } from "@/components/page-outline";
import { Card } from "@/components/ui/card";
import { getReleaseDashboard } from "@/modules/releases";
import { getTaskBoard, TASK_STATUS_LABELS } from "@/modules/tasks";
import type { TaskCard, TaskGitState, TaskStatus } from "@/modules/tasks";

const STATUS_TONE: Record<TaskStatus, string> = {
  todo: "border-sky-400/20 bg-sky-400/10 text-sky-100",
  doing: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  blocked: "border-red-400/20 bg-red-400/10 text-red-100",
  done: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
};

const GIT_STATE_LABELS: Record<TaskGitState, string> = {
  missing_branch: "未建分支",
  developing: "开发中",
  committed: "已提交",
  merged: "已合并",
  drift: "状态漂移",
};

const GIT_STATE_TONE: Record<TaskGitState, string> = {
  missing_branch: "border-white/12 bg-white/[0.05] text-white/72",
  developing: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  committed: "border-sky-400/20 bg-sky-400/10 text-sky-100",
  merged: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  drift: "border-red-400/20 bg-red-400/10 text-red-100",
};

const MODE_TONE = "border-white/12 bg-white/[0.05] text-white/78";

export default async function TasksPage() {
  const board = await getTaskBoard();
  const releaseDashboard = getReleaseDashboard();
  const outline = [
    { id: "task-overview", label: "任务总览" },
    ...board.map((group) => ({ id: `task-${group.status}`, label: TASK_STATUS_LABELS[group.status] })),
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="space-y-6">
        <section id="task-overview">
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">任务清单</p>
            <h2 className="mt-3 text-3xl font-semibold">任务与 Git 交付状态</h2>
            <p className="mt-4 max-w-4xl text-white/68">
              每次可合并改动绑定一个 task。task 负责定义目标、边界与验收，Git 负责展示当前分支、提交与是否已并入
              `main`。
            </p>
            <div className="mt-5 rounded-3xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white/72">
              {releaseDashboard.pending_dev_release
                ? `当前存在未验收 dev：${releaseDashboard.pending_dev_release.release_id}。请先验收上一个 dev，再继续出新预览。`
                : "当前没有待验收 dev；完成一轮可验收改动后，应先生成 dev 预览链接。"}
            </div>
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
                <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-xs text-white/62">
                  {group.tasks.length} 项
                </span>
              </div>
              <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-white/8">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/8 text-left text-sm">
                    <thead className="bg-white/[0.04] text-white/52">
                      <tr>
                        <HeadCell>Task</HeadCell>
                        <HeadCell>目标</HeadCell>
                        <HeadCell>状态</HeadCell>
                        <HeadCell>当前模式</HeadCell>
                        <HeadCell>Git</HeadCell>
                        <HeadCell>关联模块</HeadCell>
                        <HeadCell>更新痕迹</HeadCell>
                        <HeadCell>打开</HeadCell>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/8 bg-black/10">
                      {group.tasks.length > 0 ? (
                        group.tasks.map((task) => <TaskRow key={task.path} task={task} />)
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-5 text-white/58">
                            当前没有该状态的任务。
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </section>
        ))}
      </div>
      <PageOutline items={outline} />
    </div>
  );
}

function TaskRow({ task }: { task: TaskCard }) {
  return (
    <tr className="align-top">
      <Cell className="min-w-[220px]">
        <div className="space-y-1">
          <p className="font-medium text-white">{task.title}</p>
          <p className="text-xs text-white/45">{task.path}</p>
        </div>
      </Cell>
      <Cell className="min-w-[300px] text-white/76">{task.goal}</Cell>
      <Cell className="min-w-[120px]">
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${STATUS_TONE[task.status]}`}>
          {TASK_STATUS_LABELS[task.status]}
        </span>
      </Cell>
      <Cell className="min-w-[140px]">
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${MODE_TONE}`}>
          {task.currentMode || "未标注"}
        </span>
      </Cell>
      <Cell className="min-w-[220px]">
        <div className="space-y-2">
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${GIT_STATE_TONE[task.git.state]}`}>
            {GIT_STATE_LABELS[task.git.state]}
          </span>
          <div className="space-y-1 text-xs text-white/60">
            <p>分支：{task.branch || "未绑定"}</p>
            <p>最近提交：{task.git.recentCommit || task.recentCommit || "pending"}</p>
            <p>{task.git.detail}</p>
          </div>
        </div>
      </Cell>
      <Cell className="min-w-[220px]">
        {task.relatedModules.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {task.relatedModules.map((modulePath) => (
              <span
                key={modulePath}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/66"
              >
                {modulePath}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-white/48">无</span>
        )}
      </Cell>
      <Cell className="min-w-[250px]">
        <details className="group">
          <summary className="cursor-pointer list-none text-white/72 marker:hidden transition group-open:text-white">
            {task.updateTrace.docs || task.updateTrace.roadmap || "no change"}
          </summary>
          <dl className="mt-3 space-y-2 text-xs text-white/62">
            <TraceLine label="记忆" value={task.updateTrace.memory} />
            <TraceLine label="索引" value={task.updateTrace.index} />
            <TraceLine label="路线图" value={task.updateTrace.roadmap} />
            <TraceLine label="文档" value={task.updateTrace.docs} />
          </dl>
        </details>
      </Cell>
      <Cell className="min-w-[100px]">
        <Link
          href={`/knowledge-base?path=${encodeURIComponent(task.path)}`}
          className="inline-flex rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-xs text-accent transition hover:bg-accent/18"
        >
          打开
        </Link>
      </Cell>
    </tr>
  );
}

function HeadCell({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}

function Cell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-4 ${className ?? ""}`}>{children}</td>;
}

function TraceLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="inline text-white/42">{label}：</dt>
      <dd className="ml-1 inline">{value}</dd>
    </div>
  );
}
