import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AiEfficiencyCard, getProjectStateSnapshot } from "@/modules/project-state";
import { formatEstimatedTokens } from "../../../../../shared/ai-efficiency";

export const dynamic = "force-dynamic";

export default async function AiEfficiencyPage() {
  const projectState = await getProjectStateSnapshot();
  const dashboard = projectState.aiEfficiency.dashboard;
  const topAlert = dashboard.adoption.alerts[0] || null;

  return (
    <div className="space-y-6">
      <section id="ai-efficiency-overview">
        <PageHeader
          eyebrow="AI Efficiency"
          title="把令牌消耗、节省和 adoption 放到同一张看板"
          description="这一页只看 summary wrapper 带来的 AI 开发效率变化，不再分散到脚本日志里。"
          note="所有数字都来自 output/ai/command-gain/events.jsonl，属于估算值，只用于趋势与 ROI。"
          metrics={[
            { label: "summary runs", value: `${dashboard.overview.summary_runs} 次`, tone: "accent" },
            { label: "估算输入", value: `~${formatEstimatedTokens(dashboard.overview.total_input_tokens_est)}` },
            { label: "估算节省", value: `~${formatEstimatedTokens(dashboard.overview.total_saved_tokens_est)}`, tone: "success" },
            { label: "平均节省率", value: `${dashboard.overview.avg_savings_pct_est}%`, tone: "success" },
          ]}
        />
      </section>

      <section id="ai-efficiency-card">
        <AiEfficiencyCard dashboard={dashboard} />
      </section>

      <section id="ai-efficiency-consumption">
        <PageHeader
          eyebrow="Consumption"
          title="先看令牌主要花在哪些 profile 和命令上"
          description="消费视角用来决定下一批高 ROI wrapper 应该补哪里，而不是只看总体节省。"
          metrics={[
            { label: "最近 7 天输入", value: `~${formatEstimatedTokens(dashboard.trend_delta.last_7d_input)}` },
            { label: "前 7 天输入", value: `~${formatEstimatedTokens(dashboard.trend_delta.prev_7d_input)}` },
            { label: "已观察 profile", value: `${dashboard.coverage.observed_profiles.length} 个`, tone: "accent" },
            { label: "未用 wrapper", value: `${dashboard.coverage.never_used_profiles.length} 个`, tone: dashboard.coverage.never_used_profiles.length ? "warning" : "success" },
          ]}
        />
        <div className="grid gap-4 xl:grid-cols-2">
          <DetailList
            title="消耗最多的 profile"
            items={dashboard.consumption.top_profiles_by_input.map((item) => ({
              label: item.profile_id,
              body: `${item.runs} 次运行，输入约 ${formatEstimatedTokens(item.input_tokens_est)}，输出约 ${formatEstimatedTokens(item.output_tokens_est)}。`,
            }))}
            emptyText="当前还没有 profile 级消耗数据。"
          />
          <DetailList
            title="节省最多的 profile"
            items={dashboard.savings.top_profiles_by_saved.map((item) => ({
              label: item.profile_id,
              body: `${item.runs} 次运行，节省约 ${formatEstimatedTokens(item.saved_tokens_est)}，压缩率 ${item.savings_pct_est}%。`,
            }))}
            emptyText="当前还没有 profile 级节省数据。"
          />
          <DetailList
            title="最耗输入的原始命令"
            items={dashboard.consumption.top_commands_by_input.map((item) => ({
              label: item.original_cmd,
              body: `${item.runs} 次运行，累计输入约 ${formatEstimatedTokens(item.input_tokens_est)}。`,
            }))}
            emptyText="当前还没有命令级消耗数据。"
          />
          <DetailList
            title="7 天输入趋势"
            items={dashboard.consumption.recent_daily_input.map((item) => ({
              label: item.key,
              body: `输入约 ${formatEstimatedTokens(item.input_tokens_est)}，输出约 ${formatEstimatedTokens(item.output_tokens_est)}，节省约 ${formatEstimatedTokens(item.saved_tokens_est)}。`,
            }))}
            emptyText="当前还没有 7 天输入趋势。"
          />
        </div>
      </section>

      <section id="ai-efficiency-savings">
        <PageHeader
          eyebrow="Savings"
          title="再看哪些 wrapper 真正在稳定省令牌"
          description="节省视角用来判断当前摘要策略是否继续有效，以及下一步该优先提高 adoption 还是覆盖面。"
          metrics={[
            { label: "最近 7 天节省", value: `~${formatEstimatedTokens(dashboard.trend_delta.last_7d_saved)}`, tone: "success" },
            { label: "前 7 天节省", value: `~${formatEstimatedTokens(dashboard.trend_delta.prev_7d_saved)}` },
            { label: "最近 adoption", value: `${dashboard.trend_delta.last_7d_adoption}%`, tone: dashboard.trend_delta.last_7d_adoption >= 50 ? "success" : "warning" },
            { label: "上期 adoption", value: `${dashboard.trend_delta.prev_7d_adoption}%` },
          ]}
        />
        <div className="grid gap-4 xl:grid-cols-2">
          <DetailList
            title="节省最多的原始命令"
            items={dashboard.savings.top_commands_by_saved.map((item) => ({
              label: item.original_cmd,
              body: `${item.runs} 次运行，累计节省约 ${formatEstimatedTokens(item.saved_tokens_est)}。`,
            }))}
            emptyText="当前还没有命令级节省数据。"
          />
          <DetailList
            title="7 天节省趋势"
            items={dashboard.savings.recent_daily_saved.map((item) => ({
              label: item.key,
              body: `节省约 ${formatEstimatedTokens(item.saved_tokens_est)}，平均压缩率 ${item.savings_pct_est}%。`,
            }))}
            emptyText="当前还没有 7 天节省趋势。"
          />
        </div>
      </section>

      <section id="ai-efficiency-actions">
        <PageHeader
          eyebrow="Actions"
          title="把 adoption 警报、未用 wrapper 和任务滚动视图放到一起"
          description="行动视角直接回答下一步该推动哪条默认入口、哪类 wrapper 还没有样本，以及哪个 task 最耗上下文。"
          note={topAlert ? `${topAlert.shortcut_id} 当前是最大 adoption alert。` : "当前没有明显 deterministic adoption alert。"}
        />
        <div className="grid gap-4 xl:grid-cols-3">
          <DetailList
            title="Deterministic adoption"
            items={dashboard.adoption.deterministic_shortcuts.map((item) => ({
              label: item.shortcut_id,
              body: `${item.adopted_count}/${item.opportunity_count} 采用，adoption ${item.adoption_pct}% ，已节省约 ${formatEstimatedTokens(item.saved_tokens_est)}。`,
            }))}
            emptyText="当前还没有 deterministic shortcut 样本。"
          />
          <DetailList
            title="未用 wrapper"
            items={dashboard.coverage.never_used_profiles.map((profileId) => ({
              label: profileId,
              body: "当前系统支持这个 wrapper，但还没有跑出样本。",
            }))}
            emptyText="所有已支持 wrapper 都已有样本。"
          />
          <DetailList
            title="任务滚动视图"
            items={dashboard.task_rollups.map((item) => ({
              label: item.task_id,
              body: `${item.summary_runs} 次摘要运行，输入约 ${formatEstimatedTokens(item.input_tokens_est)}，节省约 ${formatEstimatedTokens(item.saved_tokens_est)}，平均 ${item.avg_savings_pct_est}%。`,
            }))}
            emptyText="当前还没有 task 级摘要样本。"
          />
        </div>
      </section>
    </div>
  );
}

function DetailList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: Array<{ label: string; body: string }>;
  emptyText: string;
}) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.24em] text-sky-700">{title}</p>
      <div className="mt-5 space-y-3">
        {items.length ? (
          items.map((item) => (
            <article key={`${title}-${item.label}`} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            </article>
          ))
        ) : (
          <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm leading-6 text-slate-600">{emptyText}</p>
          </article>
        )}
      </div>
    </Card>
  );
}
