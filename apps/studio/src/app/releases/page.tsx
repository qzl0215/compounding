import { headers } from "next/headers";
import { Card } from "@/components/ui/card";
import { getDeliverySnapshot } from "@/modules/delivery";
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
        <p className="text-xs uppercase tracking-[0.28em] text-danger">发布管理</p>
        <h2 className="mt-3 text-3xl font-semibold">当前入口仅允许本机或内网访问。</h2>
        <p className="mt-4 max-w-3xl text-white/68">{access.reason}</p>
      </Card>
    );
  }

  const snapshot = await getDeliverySnapshot();
  const dashboard = snapshot.facts.releaseDashboard;
  const taskOptions = snapshot.projections.taskOptions;
  const releaseConclusion = dashboard.pending_dev_release
    ? "现在该验收，不该继续堆改动。"
    : dashboard.local_runtime.status === "running"
      ? `当前 production 在线，运行版本 ${dashboard.local_runtime.runtime_release_id || "未知"}。`
      : "当前先确认运行态，再讨论继续发布。";
  const releaseNextAction = dashboard.pending_dev_release
    ? `先验收 ${dashboard.pending_dev_release.release_id}，通过或驳回后再继续推进。`
    : dashboard.local_runtime.status === "running"
      ? "如需继续推进，先生成新的 dev 预览，再进入验收。"
      : "先恢复运行态，再决定是否继续生成或切换 release。";

  return (
    <div className="space-y-6">
      <section id="release-overview">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">发布判断</p>
          <h2 className="mt-3 text-3xl font-semibold">这页只回答一件事：现在该验收、继续发布，还是先修运行态</h2>
          <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.75rem] border border-accent/18 bg-accent/8 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-accent/80">当前结论</p>
              <p className="mt-3 text-2xl font-semibold text-white">{releaseConclusion}</p>
              <p className="mt-4 text-sm leading-7 text-white/78">{releaseNextAction}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-white/42">当前入口</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Meta title="待验收 dev" value={dashboard.pending_dev_release?.release_id || "当前没有待验收 dev"} />
                <Meta title="生产激活版本" value={dashboard.active_release_id || "尚未切换任何 release"} />
                <Meta title="dev 预览链接" value={dashboard.dev_preview_url} />
                <Meta title="生产验收链接" value={dashboard.production_url} />
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section id="runtime-status">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">运行态</p>
          <h2 className="mt-3 text-3xl font-semibold">先确认 dev / production 现在是不是可信</h2>
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
          <p className="text-xs uppercase tracking-[0.28em] text-accent">第二屏：差异感知摘要</p>
          <h2 className="mt-3 text-3xl font-semibold">review / retro / ship log 放到结论之后</h2>
          <p className="mt-4 max-w-4xl text-white/68">
            这里仍然保留改动范围驱动的验证线索，但它属于“已经决定进发布页后再看的细节”，不该抢首页判断。
          </p>
          <div className="mt-6">
            <DiffAwarePanel artifact={snapshot.facts.diffAware} />
          </div>
        </Card>
      </section>

      <section id="validation-layers">
        <details className="rounded-3xl border border-white/8 bg-panel/70 p-5 shadow-glow backdrop-blur-xl">
          <summary className="cursor-pointer text-sm font-medium text-white">展开分层验证建议</summary>
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {VALIDATION_LAYERS.map((layer) => (
              <article key={layer.id} className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-5">
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
        </details>
      </section>
    </div>
  );
}

function Meta({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-black/15 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/42">{title}</p>
      <p className="mt-3 break-all text-sm text-white/78">{value}</p>
    </div>
  );
}

function RuntimeCard({ title, runtime }: { title: string; runtime: LocalRuntimeStatus }) {
  const exp = getRuntimeStatusExplanation(runtime.status, title, runtime);
  const showNextStep = runtime.status !== "running";
  return (
    <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-5">
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
