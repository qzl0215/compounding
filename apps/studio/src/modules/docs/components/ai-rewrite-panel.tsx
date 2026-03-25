"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { requestClarify, requestRewrite } from "@/modules/docs/ai-rewrite-client";
import type {
  ClarifyResponse,
  PromptDocPreview,
  RewriteIntensity,
  RewriteResponse,
} from "@/modules/docs/ai-rewrite-types";
import { PanelList, PromptDocPreviews } from "./ai-rewrite-panel-sections";
import { MarkdownContent } from "./markdown-content";

type Props = {
  open: boolean;
  path: string;
  content: string;
  promptDocs: PromptDocPreview[];
  onClose: () => void;
  onApply: (value: string) => void;
};

export function AiRewritePanel({ open, path, content, promptDocs, onClose, onApply }: Props) {
  const [intensity, setIntensity] = useState<RewriteIntensity>("medium");
  const [answers, setAnswers] = useState("");
  const [clarify, setClarify] = useState<ClarifyResponse["payload"] | null>(null);
  const [rewrite, setRewrite] = useState<RewriteResponse["payload"] | null>(null);
  const [meta, setMeta] = useState<{ provider: string; model: string } | null>(null);
  const [isClarifying, setIsClarifying] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => rewrite?.rewritten_markdown || "", [rewrite]);

  if (!open) {
    return null;
  }

  async function runClarify() {
    setError(null);
    setRewrite(null);
    setIsClarifying(true);
    try {
      const payload = await requestClarify({ path, content, intensity });
      if (!payload.payload) {
        throw new Error(payload.message || "AI 补充问题生成失败。");
      }
      setClarify(payload.payload);
      setMeta({ provider: payload.provider || "unknown", model: payload.model || "unknown" });
    } catch (value) {
      setError(value instanceof Error ? value.message : "AI 补充问题生成失败。");
    } finally {
      setIsClarifying(false);
    }
  }

  async function runRewrite() {
    setError(null);
    setIsRewriting(true);
    try {
      const payload = await requestRewrite({ path, content, intensity, answers });
      if (!payload.payload) {
        throw new Error(payload.message || "AI 重构失败。");
      }
      setRewrite(payload.payload);
      setMeta({ provider: payload.provider || "unknown", model: payload.model || "unknown" });
    } catch (value) {
      setError(value instanceof Error ? value.message : "AI 重构失败。");
    } finally {
      setIsRewriting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 w-full max-w-[720px] overflow-y-auto border-l border-slate-200 bg-white/96 px-5 py-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-sky-700">AI 重构</p>
            <h3 className="text-2xl font-semibold text-slate-900">两步文档重构</h3>
            <p className="text-sm text-slate-600">{path}</p>
            {meta ? <p className="text-xs text-slate-500">{meta.provider} / {meta.model}</p> : null}
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-sky-200 hover:text-slate-900"
            onClick={onClose}
          >
            关闭
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-700">重构强度</span>
              <select
                value={intensity}
                onChange={(event) => setIntensity(event.target.value as RewriteIntensity)}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none"
              >
                <option value="light">轻度</option>
                <option value="medium">中度</option>
                <option value="heavy">重度</option>
              </select>
              <button
                type="button"
                className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
                onClick={runClarify}
                disabled={isClarifying}
              >
                {isClarifying ? "生成中..." : "第一步：提出关键问题"}
              </button>
            </div>
            {clarify ? (
              <div className="mt-5 space-y-5">
                <PanelList title="需要补充的问题" items={clarify.questions} />
                <PanelList title="为什么要问" items={clarify.why} />
                <PanelList title="若不补充的默认假设" items={clarify.assumptions_if_unanswered} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">先让 AI 判断当前文档缺哪些关键信息，再进入正文重构。</p>
            )}
          </Card>

          <Card>
            <p className="text-sm font-medium text-slate-900">用户补充</p>
            <textarea
              value={answers}
              onChange={(event) => setAnswers(event.target.value)}
              placeholder="把 AI 提出的关键问题补充在这里。若不补充，AI 会按默认假设继续重构。"
              className="mt-4 min-h-[160px] w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
                onClick={runRewrite}
                disabled={isRewriting}
              >
                {isRewriting ? "重构中..." : "第二步：AI 重构正文"}
              </button>
              {rewrite?.rewritten_markdown ? (
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-sky-200 hover:text-slate-900"
                  onClick={() => onApply(rewrite.rewritten_markdown)}
                >
                  应用到正文草稿
                </button>
              ) : null}
            </div>
          </Card>

          {rewrite ? (
            <Card>
              <div className="space-y-5">
                <PanelList title="结构变化摘要" items={rewrite.structure_summary} />
                <PanelList title="关键信息缺失" items={rewrite.missing_information} />
                <PanelList title="建议保留" items={rewrite.keep_recommendations} />
                <PanelList title="建议删除" items={rewrite.remove_recommendations} />
                <div>
                  <p className="text-sm font-medium text-slate-900">重构强度说明</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{rewrite.intensity_note || "无"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">重构预览</p>
                  <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
                    <MarkdownContent content={preview} />
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          <Card>
            <p className="text-sm font-medium text-slate-900">当前提示词方案</p>
            <PromptDocPreviews promptDocs={promptDocs} />
          </Card>

          {error ? (
            <Card className="border-rose-200 bg-rose-50">
              <p className="text-sm text-rose-700">{error}</p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
