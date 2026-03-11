"use client";

import { useState, useTransition } from "react";
import type { ProposalBundle } from "@/lib/types";
import { ProposalDiffViewer } from "./proposal-diff-viewer";
import { RewriteProposalForm } from "./rewrite-proposal-form";

export function ProposalWorkspace({ initialProposals }: { initialProposals: ProposalBundle[] }) {
  const [proposals, setProposals] = useState(initialProposals);
  const [selectedId, setSelectedId] = useState(initialProposals[0]?.proposal.id ?? "");
  const [highlightedId, setHighlightedId] = useState("");
  const [, startTransition] = useTransition();

  async function refresh(nextSelectedId?: string) {
    const response = await fetch("/api/proposals");
    const payload = (await response.json()) as { proposals: ProposalBundle[] };
    setProposals(payload.proposals);
    const resolvedId = nextSelectedId ?? payload.proposals[0]?.proposal.id ?? "";
    setSelectedId(resolvedId);
  }

  function handleCreated(proposalId: string) {
    startTransition(async () => {
      setHighlightedId(proposalId);
      await refresh(proposalId);
    });
  }

  function handleApplied() {
    startTransition(async () => {
      await refresh(selectedId);
    });
  }

  return (
    <>
      <RewriteProposalForm onCreated={handleCreated} />
      <ProposalDiffViewer
        highlightedId={highlightedId}
        onApplied={handleApplied}
        onSelectedIdChange={setSelectedId}
        proposals={proposals}
        selectedId={selectedId}
      />
    </>
  );
}
