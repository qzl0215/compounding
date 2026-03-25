"use client";

import type { DiffAwareArtifact } from "../types";

type Props = {
  artifact: DiffAwareArtifact;
  variant?: "compact" | "full";
};

export function DiffAwarePanel({ artifact, variant = "full" }: Props) {
  const compact = variant === "compact";
  const hasDiff = artifact.changedFiles.length > 0;
  const selectedRequired = artifact.selectedChecks.required;
  const selectedRecommended = artifact.selectedChecks.recommended;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs ${hasDiff ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {hasDiff ? "有 diff" : "无 diff"}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
          健康评分 {artifact.healthScore.score}/100 ({artifact.healthScore.grade})
        </span>
      </div>

      <p className="text-sm text-slate-700">{artifact.summary}</p>

      <div className="grid gap-3 md:grid-cols-3">
        <InfoCard title="Scope" value={artifact.scopeSummary} />
        <InfoCard title="Review" value={artifact.reviewSummary} />
        <InfoCard title="Retro" value={artifact.retroSummary} />
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.22em] text-sky-700">建议检查</p>
        <div className="flex flex-wrap gap-2">
          {artifact.suggestedChecks.length > 0 ? (
            artifact.suggestedChecks.map((layer) => (
              <span key={layer.id} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                {layer.title}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
              暂无新增检查
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.22em] text-sky-700">选择原因</p>
        {selectedRequired.length + selectedRecommended.length > 0 ? (
          <div className="space-y-3">
            <CheckReasonList title="必跑" layers={selectedRequired} />
            <CheckReasonList title="可补充" layers={selectedRecommended} />
          </div>
        ) : (
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
            暂无新增检查原因
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm text-slate-700">
        <p className="text-xs uppercase tracking-[0.22em] text-sky-700">Ship Log</p>
        <ul className="space-y-2">
          {artifact.shipLog.map((item) => (
            <li key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </div>

      {!compact ? (
        <div className="space-y-2 text-sm text-slate-700">
          <p className="text-xs uppercase tracking-[0.22em] text-sky-700">证据落点</p>
          <ul className="space-y-2">
            {artifact.evidencePoints.map((point) => (
              <li key={point} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
                {point}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-2 text-sm text-slate-700">
        <p className="text-xs uppercase tracking-[0.22em] text-sky-700">退休建议</p>
        {artifact.retirementSuggestions.length > 0 ? (
          <ul className="space-y-2">
            {artifact.retirementSuggestions.map((item) => (
              <li key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">暂无可退休项；当前最小检查集仍然划算。</p>
        )}
      </div>

      {!compact ? (
        <div className="space-y-2 text-sm text-slate-700">
          <p className="text-xs uppercase tracking-[0.22em] text-sky-700">下一步</p>
          <ul className="space-y-2">
            {artifact.nextActions.map((action) => (
              <li key={action} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                {action}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/90 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <p className="mt-3 text-sm text-slate-700">{value}</p>
    </article>
  );
}

function CheckReasonList({
  title,
  layers,
}: {
  title: string;
  layers: DiffAwareArtifact["selectedChecks"]["required"];
}) {
  if (layers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <ul className="space-y-2">
        {layers.map((layer) => (
          <li key={`${title}-${layer.id}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span className="font-medium text-slate-900">{layer.title}</span>
            <span className="mx-2 text-slate-300">·</span>
            <span>{layer.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
