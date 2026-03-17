import path from "node:path";
import { readDoc } from "@/modules/docs/repository";
import { buildRewriteContext } from "./ai-rewrite-context";
import { loadPromptText } from "./ai-rewrite-prompts";
import { callOpenAiCompatible, loadProviderConfig } from "./ai-rewrite-provider";
import type { ClarifyResult, RewriteAction, RewriteIntensity, RewriteResult } from "./ai-rewrite-types";

export async function runDocRewriteAction(args: {
  action: RewriteAction;
  path: string;
  content: string;
  intensity: RewriteIntensity;
  answers?: string;
}) {
  const provider = loadProviderConfig();
  if (!provider.apiKey || !provider.model) {
    throw new Error("未检测到 Ark / Volcano / OpenAI 模型配置。请先在 .env 或 .env.local 中配置模型。");
  }

  const doc = await readDoc(args.path);
  const promptText = loadPromptText(args.action === "clarify" ? "doc-rewrite-clarify" : "doc-rewrite-execute");
  const systemPrompt = loadPromptText("doc-rewrite-system");
  const context = await buildRewriteContext({
    path: args.path,
    title: doc.meta.title ?? path.basename(args.path),
    docRole: doc.meta.doc_role ?? "unknown",
    content: args.content,
    intensity: args.intensity,
    answers: args.answers ?? "",
  });

  const responseText = await callOpenAiCompatible({
    provider,
    messages: [
      { role: "system", content: `${systemPrompt}\n\n当前动作：${args.action === "clarify" ? "补充问题" : "正文重构"}` },
      {
        role: "user",
        content: `${promptText}\n\n以下是本次调用的上下文 JSON：\n${JSON.stringify(context, null, 2)}`,
      },
    ],
  });

  const payload = extractJsonPayload(responseText);
  return {
    provider: provider.provider,
    model: provider.model,
    payload: args.action === "clarify" ? normalizeClarifyPayload(payload) : normalizeRewritePayload(payload),
  };
}

function extractJsonPayload(value: string) {
  const trimmed = value.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("模型输出不是有效 JSON。");
    }
    return JSON.parse(match[0]);
  }
}

function normalizeClarifyPayload(value: unknown): ClarifyResult {
  const payload = (value || {}) as Record<string, unknown>;
  return {
    questions: normalizeStringArray(payload.questions),
    why: normalizeStringArray(payload.why),
    assumptions_if_unanswered: normalizeStringArray(payload.assumptions_if_unanswered),
  };
}

function normalizeRewritePayload(value: unknown): RewriteResult {
  const payload = (value || {}) as Record<string, unknown>;
  return {
    rewritten_markdown: String(payload.rewritten_markdown || "").trim(),
    structure_summary: normalizeStringArray(payload.structure_summary),
    missing_information: normalizeStringArray(payload.missing_information),
    keep_recommendations: normalizeStringArray(payload.keep_recommendations),
    remove_recommendations: normalizeStringArray(payload.remove_recommendations),
    intensity_note: String(payload.intensity_note || "").trim(),
  };
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}
