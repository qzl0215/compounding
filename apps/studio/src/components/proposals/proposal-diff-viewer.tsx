"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { ProposalBundle } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Props = {
  proposals: ProposalBundle[];
  selectedId?: string;
  highlightedId?: string;
  onApplied?: () => void;
  onSelectedIdChange?: (proposalId: string) => void;
};

export function ProposalDiffViewer({
  proposals,
  selectedId,
  highlightedId,
  onApplied,
  onSelectedIdChange
}: Props) {
  const [internalSelectedId, setInternalSelectedId] = useState<string>(selectedId ?? proposals[0]?.proposal.id ?? "");
  const [statusMessage, setStatusMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (selectedId) {
      setInternalSelectedId(selectedId);
    } else if (!internalSelectedId && proposals[0]?.proposal.id) {
      setInternalSelectedId(proposals[0].proposal.id);
    }
  }, [internalSelectedId, proposals, selectedId]);

  const selected = useMemo(
    () => proposals.find((item) => item.proposal.id === internalSelectedId) ?? proposals[0],
    [internalSelectedId, proposals]
  );

  async function applyProposal() {
    if (!selected) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/proposals/${selected.proposal.id}/apply`, {
        method: "POST"
      });
      const payload = (await response.json()) as { ok: boolean; message: string };
      setStatusMessage(payload.message);
      if (payload.ok) {
        onApplied?.();
      }
    });
  }

  function selectProposal(proposalId: string) {
    setInternalSelectedId(proposalId);
    onSelectedIdChange?.(proposalId);
  }

  if (!selected) {
    return (
      <Card>
        <p className="text-sm text-white/65">还没有 review。先输入你想调整的项目变化。</p>
      </Card>
    );
  }

  const summary = selected.reviewSummary;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.32fr_0.68fr]">
      <Card className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Review Queue</p>
          <h2 className="mt-2 text-2xl font-semibold">先看摘要，再决定是否应用</h2>
        </div>
        <div className="space-y-3">
          {proposals.map((bundle) => {
            const isActive = bundle.proposal.id === selected.proposal.id;
            const isHighlighted = highlightedId === bundle.proposal.id;
            return (
              <button
                key={bundle.proposal.id}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  isActive
                    ? "border-accent/45 bg-accent/12"
                    : isHighlighted
                      ? "border-success/40 bg-success/10"
                      : "border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.05]"
                }`}
                onClick={() => selectProposal(bundle.proposal.id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm text-white">{bundle.reviewSummary.id}</span>
                  <Badge tone={bundle.proposal.status === "applied" ? "success" : "accent"}>{bundle.proposal.status}</Badge>
                </div>
                <p className="mt-3 text-sm text-white/76">{bundle.reviewSummary.goal}</p>
                <p className="mt-2 text-xs text-white/52">{bundle.reviewSummary.impact_summary}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-accent">Review Summary</p>
              <h3 className="mt-2 text-2xl font-semibold">{summary.goal}</h3>
              <p className="mt-3 max-w-3xl text-sm text-white/66">{summary.impact_summary}</p>
            </div>
            <button
              className="rounded-full border border-accent/40 bg-accent/12 px-4 py-2 text-sm text-accent transition hover:bg-accent/16 disabled:opacity-40"
              disabled={selected.proposal.status === "applied" || isPending}
              onClick={applyProposal}
              type="button"
            >
              {selected.proposal.status === "applied" ? "Already Applied" : isPending ? "Applying..." : "Accept Review"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone={summary.risk_level === "high" ? "danger" : summary.risk_level === "medium" ? "accent" : "success"}>
              risk: {summary.risk_level}
            </Badge>
            <Badge>{selected.proposal.validation_summary.target_block_count} blocks</Badge>
            <Badge>{selected.proposal.affected_files.length} files</Badge>
          </div>

          {statusMessage ? <p className="text-sm text-white/72">{statusMessage}</p> : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <InfoCard label="Touched Files" items={summary.touched_files} />
            <InfoCard label="Acceptance Note" items={[summary.acceptance_note]} />
          </div>

          <div className="rounded-3xl border border-white/8 bg-black/22 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Diff Excerpt</p>
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-white/78">{summary.diff_excerpt}</pre>
          </div>
        </Card>

        <details className="group rounded-3xl border border-white/8 bg-panel/70 p-5 shadow-glow backdrop-blur-xl">
          <summary className="cursor-pointer list-none text-sm font-medium text-white/84">
            展开 Advanced Review
          </summary>
          <div className="mt-5 space-y-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <MetaCard label="Base Revision" value={selected.proposal.base_revision} />
              <MetaCard label="Git Ready" value={String(selected.proposal.validation_summary.git_ready)} />
              <MetaCard label="Dirty Worktree" value={String(selected.proposal.validation_summary.dirty_worktree)} />
            </div>
            <div className="space-y-4">
              {selected.proposal.target_blocks.map((block) => (
                <div key={`${block.file_path}-${block.block_name}-${block.before_hash}`} className="rounded-3xl border border-white/8 bg-black/18 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={block.action_type === "canonical_update" ? "accent" : "default"}>{block.action_type}</Badge>
                    <Badge>{block.block_name}</Badge>
                    <span className="font-mono text-xs text-white/55">{block.file_path}</span>
                  </div>
                  <p className="mt-3 text-sm text-white/72">{block.change_intent}</p>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <pre className="max-h-72 overflow-auto rounded-2xl border border-white/8 bg-black/25 p-4 text-xs leading-6 text-white/72">
                      {block.before_content}
                    </pre>
                    <pre className="max-h-72 overflow-auto rounded-2xl border border-accent/15 bg-accent/6 p-4 text-xs leading-6 text-white/78">
                      {block.after_content}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-white/8 bg-black/25 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Unified Diff</p>
              <pre className="mt-4 overflow-x-auto text-xs leading-6 text-white/78">{selected.diff}</pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

function InfoCard({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-white/42">{label}</p>
      <ul className="mt-4 space-y-2 text-sm text-white/76">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/42">{label}</p>
      <p className="mt-2 break-all font-mono text-sm text-white/78">{value}</p>
    </div>
  );
}
