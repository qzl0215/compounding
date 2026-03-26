import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/classnames";
import { buildSummaryFirstWorkflow, formatEstimatedTokens } from "../../../../../../shared/ai-efficiency";
import type { AiEfficiencyDashboard } from "../types";

export function AiEfficiencyCard({ dashboard, compact = false }: { dashboard: AiEfficiencyDashboard; compact?: boolean }) {
  const defaultWorkflow = buildSummaryFirstWorkflow();
  const overview = dashboard.overview;
  const topConsumer = dashboard.consumption.top_profiles_by_input[0] || null;
  const topSaver = dashboard.savings.top_profiles_by_saved[0] || null;
  const alert = dashboard.adoption.alerts[0] || null;

  return (
    <Card className={cn(compact ? "p-5" : "p-6")}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-sky-700">AI Efficiency</p>
            <h2 className={cn("mt-3 font-semibold text-slate-900", compact ? "text-2xl" : "text-3xl")}>看令牌主要花在哪，也看省下了多少</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              当前只统计 repo-native summary wrapper；数字来自 `command-gain` 事件流，适合看趋势和 ROI。
            </p>
          </div>
          <Link
            href="/ai-efficiency"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
          >
            查看详情
          </Link>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-sky-700">默认摘要链</p>
          <p className="mt-3 text-sm leading-7 text-slate-700">默认先走 summary-first，只有摘要不足或需要原始细节时才回退 raw 命令。</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {defaultWorkflow.summary_first_commands.map((command) => (
              <code key={command} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
                {command}
              </code>
            ))}
          </div>
          <p className="mt-4 text-xs leading-6 text-slate-500">
            原始回退链：{defaultWorkflow.raw_fallback_commands.map((command) => `\`${command}\``).join(" / ")}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="估算输入" value={`~${formatEstimatedTokens(overview.total_input_tokens_est)}`} tone="default" />
          <Metric label="估算输出" value={`~${formatEstimatedTokens(overview.total_output_tokens_est)}`} tone="accent" />
          <Metric label="估算节省" value={`~${formatEstimatedTokens(overview.total_saved_tokens_est)}`} tone="success" />
          <Metric label="平均节省率" value={`${overview.avg_savings_pct_est}%`} tone={overview.avg_savings_pct_est >= 80 ? "success" : "warning"} />
        </div>

        <div className={cn("grid gap-4", compact ? "xl:grid-cols-3" : "xl:grid-cols-[1.15fr_1.15fr_0.9fr]")}>
          <Panel
            title="消耗最多"
            body={
              topConsumer
                ? `${topConsumer.profile_id} 目前最吃输入，${topConsumer.runs} 次运行累计约 ${formatEstimatedTokens(topConsumer.input_tokens_est)} tokens。`
                : "当前还没有 summary 运行样本。"
            }
            note={topConsumer ? `主要输出保持在 ~${formatEstimatedTokens(topConsumer.output_tokens_est)} tokens。` : "先跑一条 summary wrapper。"}
          />
          <Panel
            title="节省最多"
            body={
              topSaver
                ? `${topSaver.profile_id} 当前贡献最大，累计省下约 ${formatEstimatedTokens(topSaver.saved_tokens_est)} tokens。`
                : "当前还没有可用节省统计。"
            }
            note={topSaver ? `平均压缩率 ${topSaver.savings_pct_est}%。` : "等第一批 wrapper 跑起来后这里会有排行。"}
          />
          <Panel
            title="Adoption 提醒"
            body={
              alert
                ? `${alert.shortcut_id} adoption 只有 ${alert.adoption_pct}% ，当前机会 ${alert.opportunity_count} 次。`
                : "当前没有明显 adoption 警报。"
            }
            note={alert ? `按当前估算，约还有 ${formatEstimatedTokens(alert.missed_savings_est)} tokens 没省下来。` : `raw trace 率 ${dashboard.health.raw_trace_rate_pct}%，fallback ${dashboard.health.fallback_count} 次。`}
            tone={alert ? "warning" : "healthy"}
          />
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "default" | "accent" | "success" | "warning" }) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border px-4 py-4",
        tone === "default" && "border-slate-200 bg-white",
        tone === "accent" && "border-sky-200 bg-sky-50",
        tone === "success" && "border-emerald-200 bg-emerald-50",
        tone === "warning" && "border-amber-200 bg-amber-50",
      )}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Panel({ title, body, note, tone = "default" }: { title: string; body: string; note: string; tone?: "default" | "healthy" | "warning" }) {
  return (
    <article
      className={cn(
        "rounded-[1.6rem] border p-5",
        tone === "default" && "border-slate-200 bg-white",
        tone === "healthy" && "border-emerald-200 bg-emerald-50",
        tone === "warning" && "border-amber-200 bg-amber-50",
      )}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-sky-700">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-700">{body}</p>
      <p className="mt-4 text-sm leading-6 text-slate-500">{note}</p>
    </article>
  );
}
