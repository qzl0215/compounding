"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { validateProjectBrief } from "@/lib/bootstrap-validation";
import { buildGenerationPreview } from "@/lib/preview";
import type { ConfigValidationResult, ProjectBrief, ProjectBriefSchema } from "@/lib/types";

type Props = {
  initialBrief: ProjectBrief;
  schema: ProjectBriefSchema;
};

const fields: Array<keyof ProjectBrief> = [
  "project_name",
  "project_one_liner",
  "success_definition",
  "current_priority",
  "must_protect"
];

const stepCopy: Array<{
  key: keyof ProjectBrief | "confirm";
  eyebrow: string;
  title: string;
  description: string;
}> = [
  {
    key: "project_name",
    eyebrow: "Step 1",
    title: "这个项目叫什么",
    description: "写一个稳定、清晰、未来也适用的项目名称。"
  },
  {
    key: "project_one_liner",
    eyebrow: "Step 2",
    title: "这个项目为什么存在",
    description: "用一句人话说明项目价值，不要写实现细节。"
  },
  {
    key: "success_definition",
    eyebrow: "Step 3",
    title: "什么结果算成功",
    description: "系统会把这个答案转成项目作战卡和 agent 的高层目标。"
  },
  {
    key: "current_priority",
    eyebrow: "Step 4",
    title: "现在最值得先做什么",
    description: "只选一件最有 ROI 的事，避免在初始化阶段分散注意力。"
  },
  {
    key: "must_protect",
    eyebrow: "Step 5",
    title: "什么边界必须保护",
    description: "每行一项，再选择真实运行边界。"
  },
  {
    key: "confirm",
    eyebrow: "Step 6",
    title: "确认自动推导结果",
    description: "底层治理会自动生成；这里只有你最需要看的结果。"
  }
];

export function BootstrapEditor({ initialBrief, schema }: Props) {
  const [brief, setBrief] = useState<ProjectBrief>(initialBrief);
  const [lastSavedBrief, setLastSavedBrief] = useState<ProjectBrief>(initialBrief);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const fieldErrors = useMemo(() => validateProjectBrief(brief, schema), [brief, schema]);
  const isDirty = JSON.stringify(brief) !== JSON.stringify(lastSavedBrief);
  const isValid = Object.keys(fieldErrors).length === 0;
  const preview = useMemo(() => buildGenerationPreview(brief), [brief]);
  const currentStep = stepCopy[stepIndex];

  function updateField<K extends keyof ProjectBrief>(key: K, value: ProjectBrief[K]) {
    setBrief((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function saveBrief() {
    startTransition(async () => {
      const response = await fetch("/api/bootstrap/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(brief)
      });
      const payload = (await response.json()) as ConfigValidationResult;
      setMessage(payload.message);
      if (payload.ok) {
        setLastSavedBrief(brief);
        setLastSavedAt(payload.saved_at ?? new Date().toISOString());
      }
    });
  }

  async function runScaffold() {
    startTransition(async () => {
      const response = await fetch("/api/bootstrap/scaffold", {
        method: "POST"
      });
      const payload = (await response.json()) as { ok: boolean; message: string };
      setMessage(payload.message);
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.72fr_0.28fr]">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 border-b border-white/8 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-accent">Initialize</p>
            <h2 className="mt-3 text-3xl font-semibold">5 个问题，建立项目作战卡</h2>
            <p className="mt-3 max-w-2xl text-sm text-white/64">
              你不需要手动配置完整治理系统。系统会把这些答案自动转成规则、角色、项目卡和 review 约束。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={isDirty ? "danger" : "success"}>{isDirty ? "dirty" : "saved"}</Badge>
            <Badge tone={isValid ? "success" : "danger"}>{isValid ? "ready" : "needs attention"}</Badge>
            {lastSavedAt ? <Badge>{`saved ${new Date(lastSavedAt).toLocaleString("zh-CN")}`}</Badge> : null}
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.28fr_0.72fr]">
          <div className="space-y-3">
            {stepCopy.map((step, index) => {
              const active = index === stepIndex;
              const completed = index < stepIndex;
              return (
                <button
                  key={step.title}
                  className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                    active
                      ? "border-accent/45 bg-accent/12"
                      : completed
                        ? "border-success/30 bg-success/8"
                        : "border-white/8 bg-white/[0.03] hover:border-white/14"
                  }`}
                  onClick={() => setStepIndex(index)}
                  type="button"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">{step.eyebrow}</p>
                  <p className="mt-2 text-sm font-medium text-white">{step.title}</p>
                </button>
              );
            })}
          </div>

          <div className="rounded-[2rem] border border-white/8 bg-black/16 p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-accent">{currentStep.eyebrow}</p>
            <h3 className="mt-3 text-2xl font-semibold">{currentStep.title}</h3>
            <p className="mt-3 max-w-2xl text-sm text-white/62">{currentStep.description}</p>

            <div className="mt-6">
              {currentStep.key === "project_name" ? (
                <input
                  className="h-14 w-full rounded-3xl border border-white/10 bg-black/24 px-5 text-base text-white outline-none transition focus:border-accent/50"
                  onChange={(event) => updateField("project_name", event.target.value)}
                  value={brief.project_name}
                />
              ) : null}

              {currentStep.key === "project_one_liner" ? (
                <textarea
                  className="min-h-56 w-full rounded-3xl border border-white/10 bg-black/24 px-5 py-4 text-base text-white outline-none transition focus:border-accent/50"
                  onChange={(event) => updateField("project_one_liner", event.target.value)}
                  value={brief.project_one_liner}
                />
              ) : null}

              {currentStep.key === "success_definition" ? (
                <textarea
                  className="min-h-56 w-full rounded-3xl border border-white/10 bg-black/24 px-5 py-4 text-base text-white outline-none transition focus:border-accent/50"
                  onChange={(event) => updateField("success_definition", event.target.value)}
                  value={brief.success_definition}
                />
              ) : null}

              {currentStep.key === "current_priority" ? (
                <textarea
                  className="min-h-56 w-full rounded-3xl border border-white/10 bg-black/24 px-5 py-4 text-base text-white outline-none transition focus:border-accent/50"
                  onChange={(event) => updateField("current_priority", event.target.value)}
                  value={brief.current_priority}
                />
              ) : null}

              {currentStep.key === "must_protect" ? (
                <div className="space-y-4">
                  <textarea
                    className="min-h-44 w-full rounded-3xl border border-white/10 bg-black/24 px-5 py-4 text-base text-white outline-none transition focus:border-accent/50"
                    onChange={(event) =>
                      updateField(
                        "must_protect",
                        event.target.value
                          .split("\n")
                          .map((item) => item.trim())
                          .filter(Boolean)
                      )
                    }
                    value={brief.must_protect.join("\n")}
                  />
                  <select
                    className="h-14 w-full rounded-3xl border border-white/10 bg-black/24 px-5 text-base text-white outline-none transition focus:border-accent/50"
                    onChange={(event) => updateField("runtime_boundary", event.target.value as ProjectBrief["runtime_boundary"])}
                    value={brief.runtime_boundary}
                  >
                    {(schema.properties.runtime_boundary.enum ?? []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {currentStep.key === "confirm" ? (
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <SummaryCard label="Project" value={brief.project_name} />
                    <SummaryCard label="Runtime" value={brief.runtime_boundary} />
                    <SummaryCard label="Success" value={brief.success_definition} />
                    <SummaryCard label="Priority" value={brief.current_priority} />
                  </div>
                  <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">Auto Generated Core</p>
                    <ul className="mt-4 grid gap-3 md:grid-cols-2">
                      {preview.docs.map((item) => (
                        <li key={item} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/76">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">System Will Handle For You</p>
                    <ul className="mt-4 space-y-2 text-sm text-white/70">
                      {preview.modules.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>

            {currentStep.key !== "confirm" && fieldErrors[currentStep.key] ? (
              <p className="mt-3 text-sm text-danger">{fieldErrors[currentStep.key]}</p>
            ) : null}

            {message ? <p className="mt-5 text-sm text-white/68">{message}</p> : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <button
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/75 transition hover:border-white/16 hover:bg-white/[0.07] disabled:opacity-40"
                disabled={stepIndex === 0 || isPending}
                onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                type="button"
              >
                上一步
              </button>

              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/75 transition hover:border-white/16 hover:bg-white/[0.07] disabled:opacity-40"
                  disabled={!isDirty || !isValid || isPending}
                  onClick={saveBrief}
                  type="button"
                >
                  {isPending ? "保存中..." : "保存 Brief"}
                </button>
                <button
                  className="rounded-full border border-accent/40 bg-accent/12 px-4 py-2 text-sm text-accent transition hover:bg-accent/16 disabled:opacity-40"
                  disabled={isDirty || !isValid || isPending}
                  onClick={runScaffold}
                  type="button"
                >
                  {isPending ? "初始化中..." : "生成项目作战卡"}
                </button>
                <button
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/75 transition hover:border-white/16 hover:bg-white/[0.07] disabled:opacity-40"
                  disabled={stepIndex === stepCopy.length - 1 || isPending}
                  onClick={() => setStepIndex((current) => Math.min(stepCopy.length - 1, current + 1))}
                  type="button"
                >
                  下一步
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">What You Answer</p>
          <h3 className="mt-2 text-xl font-semibold">用户只需要关心这 5 件事</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            {fields.map((field) => (
              <li key={field} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                {schema.properties[field].title}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Advanced Is Hidden</p>
          <h3 className="mt-2 text-xl font-semibold">复杂治理会自动处理</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>角色和规则由系统自动推导。</li>
            <li>完整知识内核在 docs 中生成，但默认折叠。</li>
            <li>关键改动自动进入 Reviews，不需要你手动拼 review 结构。</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-white/42">{label}</p>
      <p className="mt-2 text-sm leading-7 text-white/78">{value}</p>
    </div>
  );
}
