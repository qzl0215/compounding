"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { TaskBrief } from "@/lib/types";

export function TaskWorkbench() {
  const [taskGoal, setTaskGoal] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [notes, setNotes] = useState("");
  const [brief, setBrief] = useState<TaskBrief | null>(null);
  const [isPending, startTransition] = useTransition();

  async function generateBrief() {
    startTransition(async () => {
      const response = await fetch("/api/tasks/brief", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          task_goal: taskGoal,
          expected_output: expectedOutput,
          notes
        })
      });
      const payload = (await response.json()) as { ok: boolean; task_brief?: TaskBrief };
      if (payload.ok && payload.task_brief) {
        setBrief(payload.task_brief);
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.48fr_0.52fr]">
      <Card>
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Tasks</p>
        <h2 className="mt-2 text-3xl font-semibold">给系统一个任务目标，剩下的约束自动补齐</h2>
        <div className="mt-6 space-y-4">
          <Field label="任务目标">
            <textarea
              className="min-h-32 w-full rounded-3xl border border-white/10 bg-black/24 px-5 py-4 text-base text-white outline-none transition focus:border-accent/50"
              onChange={(event) => setTaskGoal(event.target.value)}
              placeholder="例如：把首页改成更像专业产品，而不是展示治理术语。"
              value={taskGoal}
            />
          </Field>
          <Field label="期望交付">
            <textarea
              className="min-h-28 w-full rounded-3xl border border-white/10 bg-black/24 px-5 py-4 text-base text-white outline-none transition focus:border-accent/50"
              onChange={(event) => setExpectedOutput(event.target.value)}
              placeholder="例如：一个可访问的首页改版，包含新的 CTA 和更清晰的信息层级。"
              value={expectedOutput}
            />
          </Field>
          <Field label="补充说明">
            <textarea
              className="min-h-28 w-full rounded-3xl border border-white/10 bg-black/24 px-5 py-4 text-base text-white outline-none transition focus:border-accent/50"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="例如：不要过度优化；优先做最有 ROI 的部分。"
              value={notes}
            />
          </Field>
          <div className="flex justify-end">
            <button
              className="rounded-full border border-accent/40 bg-accent/12 px-5 py-2.5 text-sm text-accent transition hover:bg-accent/16 disabled:opacity-40"
              disabled={!taskGoal.trim() || !expectedOutput.trim() || isPending}
              onClick={generateBrief}
              type="button"
            >
              {isPending ? "生成中..." : "生成 Agent Brief"}
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Agent Brief</p>
        <h3 className="mt-2 text-2xl font-semibold">系统已经帮你补上约束、上下文和验收方式</h3>
        {brief ? (
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge tone="accent">{brief.review_mode}</Badge>
              <Badge>constraints: {brief.resolved_constraints.length}</Badge>
              <Badge>context: {brief.suggested_context.length}</Badge>
            </div>
            <Section title="Resolved Constraints" items={brief.resolved_constraints} />
            <Section title="Suggested Context" items={brief.suggested_context} />
            <Section title="Acceptance Criteria" items={brief.acceptance_criteria} />
            <div className="rounded-3xl border border-white/8 bg-black/22 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Agent Prompt</p>
              <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-sm leading-7 text-white/78">{brief.agent_prompt}</pre>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-white/62">输入任务后，系统会生成一份可直接交给 agent 的任务包。</p>
        )}
      </Card>
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-white/45">{title}</p>
      <ul className="mt-4 space-y-2 text-sm text-white/76">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
