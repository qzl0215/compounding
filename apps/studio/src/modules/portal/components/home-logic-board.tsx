import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/classnames";
import { HOME_ENTRY_LINKS } from "../constants";
import type { HomeLogicMapSnapshot, HomeLogicNode, HomeLogicNodeState } from "../types";

export function HomeLogicBoard({ snapshot }: { snapshot: HomeLogicMapSnapshot }) {
  const focusNode = snapshot.logicMap.nodes.find((node) => node.id === "focus");
  const chainNodes = ["goals", "plan", "execution", "acceptance"]
    .map((id) => snapshot.logicMap.nodes.find((node) => node.id === id))
    .filter((node): node is HomeLogicNode => Boolean(node));
  const headlineDetail =
    snapshot.headline.overallSummary !== snapshot.identity.oneLiner ? snapshot.headline.overallSummary : undefined;

  const attentionItems = [
    ...snapshot.attention.blockers.map((item) => ({ label: "当前阻塞", detail: item, tone: "danger" as const })),
    ...(snapshot.attention.pendingAcceptance
      ? [{ label: "待验收", detail: snapshot.attention.pendingAcceptance, tone: "warning" as const }]
      : []),
    ...(snapshot.attention.runtimeAlert ? [{ label: "运行提醒", detail: snapshot.attention.runtimeAlert, tone: "danger" as const }] : []),
  ];

  return (
    <div className="space-y-6">
      <section id="home-headline">
        <PageHeader
          eyebrow="项目态势图"
          title={snapshot.identity.name}
          description={snapshot.identity.oneLiner}
          note={headlineDetail}
          badges={snapshot.success.criteria.map((criterion) => ({ label: criterion }))}
          metrics={[
            {
              label: "当前阶段",
              value: snapshot.headline.currentPhase,
              tone: "accent",
            },
            {
              label: "当前里程碑",
              value: snapshot.headline.currentMilestone,
            },
            {
              label: "成功标准",
              value: `${snapshot.success.criteria.length} 项`,
              tone: "success",
            },
            {
              label: "当前阻塞",
              value: snapshot.attention.blockers.length > 0 ? `${snapshot.attention.blockers.length} 项` : "无",
              tone: snapshot.attention.blockers.length > 0 ? "warning" : "success",
            },
          ]}
        />
      </section>

      <section id="home-logic-map">
        <Card>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-sky-700">逻辑结构图</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900">先看逻辑，再点节点</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">每个节点都能打开对应文档或页面；首页只负责给出判断和路线，不平铺工程内部对象。</p>
            </div>

            {focusNode ? (
              <div className="flex justify-center">
                <div className="max-w-[28rem] flex-1">
                  <LogicNodeCard node={focusNode} emphasized />
                </div>
              </div>
            ) : null}

            <div className="mx-auto h-8 w-px bg-slate-200" aria-hidden="true" />

            <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:justify-between">
              {chainNodes.map((node, index) => (
                <div key={node.id} className="flex flex-1 flex-col items-stretch lg:flex-row lg:items-center">
                  <LogicNodeCard node={node} />
                  {index < chainNodes.length - 1 ? <Connector /> : null}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section id="home-attention">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <Card>
            <p className="text-xs uppercase tracking-[0.24em] text-sky-700">异常与提醒</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">先处理值得人判断的事</h2>
            {attentionItems.length > 0 ? (
              <div className="mt-5 space-y-3">
                {attentionItems.map((item) => (
                  <article
                    key={`${item.label}-${item.detail}`}
                    className={cn(
                      "rounded-[1.4rem] border p-4",
                      item.tone === "danger" && "border-rose-200 bg-rose-50",
                      item.tone === "warning" && "border-amber-200 bg-amber-50",
                    )}
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{item.detail}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">健康结论</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">{snapshot.attention.healthSummary}</p>
              </div>
            )}
          </Card>

          <Card>
            <p className="text-xs uppercase tracking-[0.24em] text-sky-700">继续查看</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">下钻入口</h2>
            <div className="mt-5 space-y-3">
              {HOME_ENTRY_LINKS.map((entry) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="block rounded-[1.4rem] border border-slate-200 bg-white p-4 transition hover:border-sky-200 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">{entry.label}</p>
                    <NodeStateBadge state="healthy">打开</NodeStateBadge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{entry.description}</p>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section id="home-ai-efficiency">
        <Card>
          <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr_1fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-sky-700">AI Efficiency</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">令牌主要花在哪里，也主要省在哪里</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">这块只看 summary wrapper 的估算结果，用来判断当前 AI 开发流是不是继续高效。</p>
            </div>
            <article className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">累计节省</p>
              <p className="mt-3 text-xl font-semibold text-slate-900">{snapshot.aiEfficiency.totalSavedLabel}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">平均节省率 {snapshot.aiEfficiency.avgSavingsLabel}</p>
            </article>
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">当前提醒</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {snapshot.aiEfficiency.alert || "当前没有明显 adoption 警报，继续用 summary wrapper 保持上下文干净。"}
              </p>
            </article>
          </div>
        </Card>
      </section>
    </div>
  );
}

function LogicNodeCard({ node, emphasized = false }: { node: HomeLogicNode; emphasized?: boolean }) {
  return (
    <Link
      href={node.href}
      aria-label={node.label}
      className={cn(
        "group block rounded-[1.6rem] border p-4 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-slate-50",
        emphasized ? "border-sky-200 bg-sky-50" : nodeStateSurface(node.state),
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{node.label}</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">{node.summary}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {node.badge ? <NodeStateBadge state={node.state}>{node.badge}</NodeStateBadge> : null}
          <span className="text-xs uppercase tracking-[0.18em] text-slate-400 transition group-hover:text-sky-700">查看</span>
        </div>
      </div>
    </Link>
  );
}

function Connector() {
  return (
    <div className="flex items-center justify-center py-1 lg:px-3 lg:py-0" aria-hidden="true">
      <div className="h-8 w-px bg-slate-200 lg:h-px lg:w-10" />
    </div>
  );
}

function NodeStateBadge({ state, children }: { state: HomeLogicNodeState; children: string }) {
  return (
    <span className={cn("inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em]", nodeStateBadge(state))}>
      {children}
    </span>
  );
}

function nodeStateSurface(state: HomeLogicNodeState) {
  if (state === "active") {
    return "border-sky-200 bg-sky-50";
  }
  if (state === "warning") {
    return "border-amber-200 bg-amber-50";
  }
  if (state === "complete") {
    return "border-emerald-200 bg-emerald-50";
  }
  return "border-slate-200 bg-white";
}

function nodeStateBadge(state: HomeLogicNodeState) {
  if (state === "active") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }
  if (state === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (state === "complete") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
}
