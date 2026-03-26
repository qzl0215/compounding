import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AiEfficiencyCard, getProjectStateSnapshot } from "@/modules/project-state";
import { formatEstimatedTokens } from "../../../../../shared/ai-efficiency";

export const dynamic = "force-dynamic";

export default async function AiEfficiencyPage() {
  const projectState = await getProjectStateSnapshot();
  const dashboard = projectState.aiEfficiency.dashboard;

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

      <section id="ai-efficiency-details">
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
            title="Deterministic adoption"
            items={dashboard.adoption.deterministic_shortcuts.map((item) => ({
              label: item.shortcut_id,
              body: `${item.adopted_count}/${item.opportunity_count} 采用，adoption ${item.adoption_pct}% ，已节省约 ${formatEstimatedTokens(item.saved_tokens_est)}。`,
            }))}
            emptyText="当前还没有 deterministic shortcut 样本。"
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
