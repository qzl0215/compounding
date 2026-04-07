import type { ClarifyResponse, RewriteIntensity, RewriteResponse } from "./ai-rewrite-types";

export async function requestClarify(args: {
  path: string;
  content: string;
  intensity: RewriteIntensity;
}) {
  return postRewriteAction<ClarifyResponse>({
    action: "clarify",
    path: args.path,
    content: args.content,
    intensity: args.intensity,
  });
}

export async function requestRewrite(args: {
  path: string;
  content: string;
  intensity: RewriteIntensity;
  answers: string;
}) {
  return postRewriteAction<RewriteResponse>({
    action: "rewrite",
    path: args.path,
    content: args.content,
    intensity: args.intensity,
    answers: args.answers,
  });
}

async function postRewriteAction<T>(payload: Record<string, unknown>) {
  const response = await fetch("/api/docs/ai-rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await response.json().catch(() => ({}))) as T & { ok?: boolean; message?: string };
  if (!response.ok || !body.ok) {
    throw new Error(body.message || "AI 文档重构请求失败。");
  }
  return body;
}
