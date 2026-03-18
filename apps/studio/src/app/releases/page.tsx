import { headers } from "next/headers";
import { PageOutline } from "@/components/page-outline";
import { Card } from "@/components/ui/card";
import { getDeliverySnapshot } from "@/modules/delivery";
import { getManagementAccessState, getRuntimeStatusExplanation } from "@/modules/releases";
import type { LocalRuntimeStatus } from "@/modules/releases";
import { ReleaseDashboardPanel } from "@/modules/releases/components/release-dashboard-panel";
import { VALIDATION_LAYERS } from "@/modules/releases/validation";

export const dynamic = "force-dynamic";

export default async function ReleasesPage() {
  const access = getManagementAccessState(await headers());

  if (!access.allowed) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-danger">发布管理</p>
          <h2 className="mt-3 text-3xl font-semibold">当前入口仅允许本机或内网访问。</h2>
          <p className="mt-4 max-w-3xl text-white/68">{access.reason}</p>
        </Card>
        <PageOutline items={[]} emptyText="当前页面没有可导航区块。" />
      </div>
    );
  }

  const snapshot = await getDeliverySnapshot();
  const dashboard = snapshot.releaseDashboard;
  const taskOptions = snapshot.taskCards
    .filter((task) => task.status !== "done")
    .map((task) => ({ id: task.id, label: `${task.shortId || task.id} ${task.title}`.trim() }));
  const outline = [
    { id: "release-overview", label: "通道总览" },
    { id: "validation-layers", label: "验证层级" },
    { id: "runtime-status", label: "运行态" },
    { id: "release-history", label: "版本台账" },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="space-y-6">
        <section id="release-overview">
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">发布管理</p>
            <h2 className="mt-3 text-3xl font-semibold">dev 预览验收与 main 生产切换</h2>
            <p className="mt-4 max-w-4xl text-white/68">
              这里是统一驾驶舱下的发布详情页。首页只摘要显示待验收版本和运行风险；需要判断是否发布、回滚或排查环境时，
              再进入这里查看完整事实。
            </p>
            <dl className="mt-6 grid gap-4 md:grid-cols-4">
              <Meta title="运行根目录" value={dashboard.runtime_root} />
              <Meta title="待验收 dev" value={dashboard.pending_dev_release?.release_id || "当前没有待验收 dev"} />
              <Meta title="生产激活版本" value={dashboard.active_release_id || "尚未切换任何 release"} />
              <Meta title="历史版本数" value={String(dashboard.releases.length)} />
            </dl>
            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              <Meta title="dev 预览链接" value={dashboard.dev_preview_url} />
              <Meta title="生产验收链接" value={dashboard.production_url} />
            </dl>
          </Card>
        </section>
        <section id="validation-layers">
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">分层验证</p>
            <h2 className="mt-3 text-3xl font-semibold">发布前推荐先跑哪一层检查</h2>
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {VALIDATION_LAYERS.map((layer) => (
                <article key={layer.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-accent">{layer.title}</p>
                  <p className="mt-3 text-sm text-white/72">{layer.summary}</p>
                  <div className="mt-4 space-y-3 text-sm text-white/72">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/42">推荐命令</p>
                      <ul className="mt-2 space-y-2">
                        {layer.commands.map((command) => (
                          <li key={command} className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2 font-mono text-xs text-white/78">
                            {command}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/42">何时跑</p>
                      <p className="mt-2">{layer.runWhen}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/42">失败说明</p>
                      <p className="mt-2">{layer.failureMeaning}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/42">下一步</p>
                      <p className="mt-2">{layer.nextStep}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Card>
        </section>
        <section id="runtime-status">
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">本地运行态</p>
            <h2 className="mt-3 text-3xl font-semibold">dev 与 production 的真实运行状态</h2>
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              <RuntimeCard title="dev 预览" runtime={dashboard.local_preview} />
              <RuntimeCard title="production" runtime={dashboard.local_runtime} />
            </div>
          </Card>
        </section>
        <section id="release-history">
          <ReleaseDashboardPanel
            activeReleaseId={dashboard.active_release_id}
            pendingDevRelease={dashboard.pending_dev_release}
            productionUrl={dashboard.production_url}
            previewUrl={dashboard.dev_preview_url}
            releases={dashboard.releases}
            runtimeStatus={dashboard.local_runtime}
            taskOptions={taskOptions}
          />
        </section>
      </div>
      <PageOutline items={outline} />
    </div>
  );
}

function Meta({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/42">{title}</p>
      <p className="mt-3 break-all text-sm text-white/78">{value}</p>
    </div>
  );
}

function RuntimeCard({ title, runtime }: { title: string; runtime: LocalRuntimeStatus }) {
  const exp = getRuntimeStatusExplanation(runtime.status, title, runtime);
  const showNextStep = runtime.status !== "running";
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-accent">{title}</p>
      <p className="mt-3 text-sm text-white/68">{exp.explanation}</p>
      {showNextStep ? (
        <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/8 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-accent/80">下一步</p>
          <p className="mt-2 text-sm text-white/78">{exp.nextStep}</p>
        </div>
      ) : null}
      <dl className="mt-4 grid gap-3 md:grid-cols-2">
        <Meta title="运行状态" value={exp.humanLabel} />
        <Meta title="监听端口" value={String(runtime.port)} />
        <Meta title="运行版本" value={runtime.runtime_release_id || "未启动"} />
        <Meta title="软链指向" value={runtime.current_release_id || "未切换 release"} />
      </dl>
    </div>
  );
}
