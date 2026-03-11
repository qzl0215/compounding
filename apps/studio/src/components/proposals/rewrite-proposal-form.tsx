"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";

export function RewriteProposalForm({ onCreated }: { onCreated?: (proposalId: string) => void }) {
  const [prompt, setPrompt] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function submitPrompt() {
    startTransition(async () => {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });
      const payload = (await response.json()) as { ok: boolean; message: string; proposal_id?: string };
      setMessage(payload.message);
      if (payload.ok && payload.proposal_id) {
        setPrompt("");
        onCreated?.(payload.proposal_id);
      }
    });
  }

  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.28em] text-accent">New Review</p>
      <h3 className="mt-2 text-xl font-semibold">描述你想改变什么，系统会先生成摘要审批</h3>
      <textarea
        className="mt-4 min-h-44 w-full rounded-3xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-accent/50"
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="例如：把项目作战卡里的成功定义写得更清楚；补一条更适合小白的 review 规则；把 playbook 的任务步骤再压缩。"
        value={prompt}
      />
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-white/55">{message || "系统会先生成 review summary，不会直接改写仓库文件。"}</p>
        <button
          className="rounded-full border border-accent/40 bg-accent/12 px-4 py-2 text-sm text-accent transition hover:bg-accent/16 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!prompt.trim() || isPending}
          onClick={submitPrompt}
          type="button"
        >
          {isPending ? "Generating..." : "Generate Review"}
        </button>
      </div>
    </Card>
  );
}
