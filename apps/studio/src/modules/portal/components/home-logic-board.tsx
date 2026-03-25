import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/classnames";
import { HOME_ENTRY_LINKS } from "../constants";
import type { HomeLogicMapSnapshot, HomeLogicNode, HomeLogicNodeState } from "../types";

export function HomeLogicBoard({ snapshot }: { snapshot: HomeLogicMapSnapshot }) {
  const focusNode = snapshot.logicMap.nodes.find((node) => node.id === "focus");
  const chainNodes = ["goals", "plan", "execution", "acceptance"]
    .map((id) => snapshot.logicMap.nodes.find((node) => node.id === id))
    .filter((node): node is HomeLogicNode => Boolean(node));

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
        <Card className="overflow-hidden">
          <p className="text-xs uppercase tracking-[0.32em] text-accent">项目态势图</p>
          <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <h1 className="text-4xl font-semibold leading-tight">{snapshot.identity.name}</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-white/72">{snapshot.identity.oneLiner}</p>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-white/62">{snapshot.headline.overallSummary}</p>
            </div>
            <div className="flex flex-wrap gap-2 xl:max-w-[420px] xl:justify-end">
              <HeaderPill label="当前阶段" value={snapshot.headline.currentPhase} tone="accent" />
              <HeaderPill label="当前里程碑" value={snapshot.headline.currentMilestone} tone="default" />
            </div>
          </div>
          {snapshot.success.criteria.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {snapshot.success.criteria.map((criterion) => (
                <Badge key={criterion} tone="default">
                  {criterion}
                </Badge>
              ))}
            </div>
          ) : null}
        </Card>
      </section>

      <section id="home-logic-map">
        <Card>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-accent">逻辑结构图</p>
              <h2 className="mt-3 text-3xl font-semibold">先看逻辑，再点节点</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/64">每个节点都能打开对应文档或页面；首页只负责给出判断和路线，不平铺工程内部对象。</p>
            </div>

            {focusNode ? (
              <div className="flex justify-center">
                <div className="max-w-[28rem] flex-1">
                  <LogicNodeCard node={focusNode} emphasized />
                </div>
              </div>
            ) : null}

            <div className="mx-auto h-8 w-px bg-white/10" aria-hidden="true" />

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
            <p className="text-xs uppercase tracking-[0.24em] text-accent">异常与提醒</p>
            <h2 className="mt-3 text-2xl font-semibold">先处理值得人判断的事</h2>
            {attentionItems.length > 0 ? (
              <div className="mt-5 space-y-3">
                {attentionItems.map((item) => (
                  <article
                    key={`${item.label}-${item.detail}`}
                    className={cn(
                      "rounded-[1.4rem] border p-4",
                      item.tone === "danger" && "border-danger/40 bg-danger/10",
                      item.tone === "warning" && "border-amber-300/30 bg-amber-300/10",
                    )}
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-white/48">{item.label}</p>
                    <p className="mt-3 text-sm leading-6 text-white/80">{item.detail}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[1.4rem] border border-success/30 bg-success/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-success">健康结论</p>
                <p className="mt-3 text-sm leading-6 text-white/80">{snapshot.attention.healthSummary}</p>
              </div>
            )}
          </Card>

          <Card>
            <p className="text-xs uppercase tracking-[0.24em] text-accent">继续查看</p>
            <h2 className="mt-3 text-2xl font-semibold">下钻入口</h2>
            <div className="mt-5 space-y-3">
              {HOME_ENTRY_LINKS.map((entry) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="block rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 transition hover:border-accent/30 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-white">{entry.label}</p>
                    <NodeStateBadge state="healthy">打开</NodeStateBadge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/64">{entry.description}</p>
                </Link>
              ))}
            </div>
          </Card>
        </div>
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
        "group block rounded-[1.6rem] border p-4 transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-white/[0.05]",
        emphasized ? "border-accent/35 bg-accent/10" : nodeStateSurface(node.state),
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/42">{node.label}</p>
          <p className="mt-3 text-sm leading-6 text-white/78">{node.summary}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {node.badge ? <NodeStateBadge state={node.state}>{node.badge}</NodeStateBadge> : null}
          <span className="text-xs uppercase tracking-[0.18em] text-white/35 transition group-hover:text-accent">查看</span>
        </div>
      </div>
    </Link>
  );
}

function HeaderPill({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "accent" }) {
  return (
    <div className={cn("rounded-full border px-4 py-2", tone === "accent" ? "border-accent/40 bg-accent/10" : "border-white/10 bg-white/5")}>
      <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex items-center justify-center py-1 lg:px-3 lg:py-0" aria-hidden="true">
      <div className="h-8 w-px bg-white/10 lg:h-px lg:w-10" />
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
    return "border-accent/35 bg-accent/10";
  }
  if (state === "warning") {
    return "border-amber-300/30 bg-amber-300/10";
  }
  if (state === "complete") {
    return "border-success/25 bg-success/10";
  }
  return "border-white/10 bg-white/[0.03]";
}

function nodeStateBadge(state: HomeLogicNodeState) {
  if (state === "active") {
    return "border-accent/45 bg-accent/10 text-accent";
  }
  if (state === "warning") {
    return "border-amber-300/35 bg-amber-300/10 text-amber-200";
  }
  if (state === "complete") {
    return "border-success/40 bg-success/10 text-success";
  }
  return "border-white/10 bg-white/5 text-white/70";
}
