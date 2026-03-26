import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProjectJudgementContract } from "../types";

export function ProjectJudgementStrip({ judgement }: { judgement: ProjectJudgementContract }) {
  const attentionCount =
    judgement.blockers.length +
    (judgement.pendingAcceptance ? 1 : 0) +
    (judgement.runtimeAlert ? 1 : 0);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr_0.95fr]">
      <Card className="p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-sky-700">当前判断</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">{judgement.overallSummary}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">{judgement.healthSummary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="accent">{judgement.currentPhase}</Badge>
          <Badge tone={attentionCount > 0 ? "warning" : "success"}>
            {attentionCount > 0 ? `提醒 ${attentionCount} 项` : "当前稳定"}
          </Badge>
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-sky-700">下一步</p>
        <p className="mt-3 text-base leading-7 text-slate-800">{judgement.nextAction}</p>
        <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">建议先读</p>
          <Link
            href={`/knowledge-base?path=${encodeURIComponent(judgement.recommendedRead.path)}`}
            className="mt-3 block text-sm font-medium text-slate-900 underline decoration-sky-200 underline-offset-4 transition hover:text-sky-700"
          >
            {judgement.recommendedRead.label}
          </Link>
          <p className="mt-2 text-sm leading-6 text-slate-600">{judgement.recommendedRead.reason}</p>
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-sky-700">推荐入口</p>
        <Link
          href={judgement.recommendedSurface.href}
          className="mt-3 block rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 transition hover:border-sky-200 hover:bg-slate-50"
        >
          <p className="text-sm font-medium text-slate-900">{judgement.recommendedSurface.label}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{judgement.recommendedSurface.reason}</p>
        </Link>
        <p className="mt-4 text-sm leading-6 text-slate-600">先按这一步进入，再看更细的执行、验收或规划信息。</p>
      </Card>
    </div>
  );
}
