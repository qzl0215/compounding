import { headers } from "next/headers";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { HarnessBoard } from "@/modules/harness";
import { getOrchestrationSnapshot } from "@/modules/orchestration";
import { ProjectJudgementStrip } from "@/modules/project-state";
import { DiffAwarePanel } from "@/modules/delivery/components/diff-aware-panel";
import { getManagementAccessState, getRuntimeStatusExplanation } from "@/modules/releases";
import type { LocalRuntimeStatus } from "@/modules/releases";
import { ReleaseDashboardPanel } from "@/modules/releases/components/release-dashboard-panel";
import { VALIDATION_LAYERS } from "@/modules/releases/validation";

export const dynamic = "force-dynamic";

export default async function ReleasesPage() {
  const access = getManagementAccessState(await headers());

  if (!access.allowed) {
    return (
      <Card>
        <p className="text-xs uppercase tracking-[0.28em] text-rose-700">发布管理</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">当前入口仅允许本机或内网访问。</h2>
        <p className="mt-4 max-w-3xl text-slate-600">{access.reason}</p>
      </Card>
    );
  }

  const snapshot = await getOrchestrationSnapshot();
  const dashboard = snapshot.delivery.facts.releaseDashboard;
  const taskOptions = snapshot.delivery.projections.taskOptions;

  return (
    <div className="space-y-6">
      <section id="release-overview">
        <PageHeader
          eyebrow="发布判断"
          title="这页只回答一件事：现在该验收、继续发布，还是先修运行态"
          description={snapshot.projectState.release.conclusion}
          note={snapshot.projectState.release.nextAction}
          metrics={[
            {
              label: "生产激活版本",
              value: dashboard.active_release_id || "尚未切换",
              tone: dashboard.active_release_id ? "success" : "default",
            },
            {
              label: "待验收 dev",
              value: dashboard.pending_dev_release?.release_id || "当前没有",
              tone: dashboard.pending_dev_release ? "warning" : "default",
            },
            {
              label: "dev 预览",
              value: dashboard.local_preview.status === "running" ? "可用" : "待恢复",
              tone: dashboard.local_preview.status === "running" ? "success" : "warning",
            },
            {
              label: "production",
              value: dashboard.local_runtime.status === "running" ? "在线" : "异常",
              tone: dashboard.local_runtime.status === "running" ? "success" : "danger",
            },
          ]}
        />
      </section>

      <section id="release-judgement">
        <ProjectJudgementStrip judgement={snapshot.projectState.judgement} />
      </section>

      <section id="release-harness">
        <HarnessBoard snapshot={snapshot.harness} compact />
      </section>

      <section id="runtime-status">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-sky-700">运行态</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">先确认 dev / production 现在是不是可信</h2>
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

      <section id="diff-aware-artifacts">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-sky-700">第二屏：差异感知摘要</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">review / retro / ship log 放到结论之后</h2>
          <p className="mt-4 max-w-4xl text-slate-600">
            这里仍然保留改动范围驱动的验证线索，但它属于“已经决定进发布页后再看的细节”，不该抢首页判断。
          </p>
          <div className="mt-6">
            <DiffAwarePanel artifact={snapshot.delivery.facts.diffAware} />
          </div>
        </Card>
      </section>

      <section id="validation-layers">
        <details className="rounded-3xl border border-slate-200 bg-panel/70 p-5 shadow-glow backdrop-blur-xl">
          <summary className="cursor-pointer text-sm font-medium text-slate-900">展开分层验证建议</summary>
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {VALIDATION_LAYERS.map((layer) => (
              <article key={layer.id} className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-sky-700">{layer.title}</p>
                <p className="mt-3 text-sm text-slate-700">{layer.summary}</p>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">推荐命令</p>
                    <ul className="mt-2 space-y-2">
                      {layer.commands.map((command) => (
                        <li key={command} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
                          {command}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">何时跑</p>
                    <p className="mt-2">{layer.runWhen}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">失败说明</p>
                    <p className="mt-2">{layer.failureMeaning}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">下一步</p>
                    <p className="mt-2">{layer.nextStep}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </details>
      </section>
    </div>
  );
}

function Meta({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <p className="mt-3 break-all text-sm text-slate-700">{value}</p>
    </div>
  );
}

function RuntimeCard({ title, runtime }: { title: string; runtime: LocalRuntimeStatus }) {
  const exp = getRuntimeStatusExplanation(runtime.status, title, runtime);
  const showNextStep = runtime.status !== "running";
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-sky-700">{title}</p>
      <p className="mt-3 text-sm text-slate-700">{exp.explanation}</p>
      {showNextStep ? (
        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-sky-700">下一步</p>
          <p className="mt-2 text-sm text-slate-700">{exp.nextStep}</p>
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
