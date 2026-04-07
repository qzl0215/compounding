import fs from "node:fs";
import path from "node:path";
import { getWorkspaceRoot } from "@/lib/workspace";
import type { ProviderConfig } from "./ai-rewrite-types";

const workspaceRoot = getWorkspaceRoot();

export function loadProviderConfig(): ProviderConfig {
  const fileEnv = loadRootEnv();
  const apiKey = readEnvValue(fileEnv, "ARK_API_KEY", "VOLCANO_API_KEY", "OPENAI_API_KEY");
  const model = readEnvValue(fileEnv, "ARK_MODEL", "MODEL_NAME", "VOLCANO_MODEL_ID", "OPENAI_MODEL");
  const baseUrl =
    readEnvValue(fileEnv, "ARK_BASE_URL", "VOLCANO_BASE_URL", "OPENAI_BASE_URL") ||
    "https://ark.cn-beijing.volces.com/api/v3";
  const provider = apiKey && model ? "ark-openai-compatible" : "unconfigured";
  return { apiKey, model, baseUrl, provider };
}

export async function callOpenAiCompatible(args: {
  provider: ProviderConfig;
  messages: Array<{ role: "system" | "user"; content: string }>;
}) {
  const response = await fetch(completionEndpoint(args.provider.baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.provider.apiKey}`,
    },
    body: JSON.stringify({
      model: args.provider.model,
      messages: args.messages,
      temperature: 0.3,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || `模型调用失败：${response.status}`);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .filter((item) => item.type === "text")
      .map((item) => item.text || "")
      .join("\n");
  }
  throw new Error("模型返回内容为空。");
}

function loadRootEnv() {
  const payload: Record<string, string> = {};
  for (const fileName of [".env.local", ".env"]) {
    const absolute = path.join(workspaceRoot, fileName);
    if (!fs.existsSync(absolute)) {
      continue;
    }
    for (const raw of fs.readFileSync(absolute, "utf8").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) {
        continue;
      }
      const [key, ...rest] = line.split("=");
      payload[key.trim()] = stripQuotes(rest.join("=").trim());
    }
  }
  return payload;
}

function stripQuotes(value: string) {
  if (value.length >= 2 && value[0] === value[value.length - 1] && ["'", '"'].includes(value[0])) {
    return value.slice(1, -1);
  }
  return value;
}

function readEnvValue(fileEnv: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    if (process.env[key]) {
      return process.env[key]!;
    }
  }
  for (const key of keys) {
    if (fileEnv[key]) {
      return fileEnv[key];
    }
  }
  return null;
}

function completionEndpoint(baseUrl: string) {
  const normalized = baseUrl.replace(/\/+$/, "");
  return normalized.endsWith("/chat/completions") ? normalized : `${normalized}/chat/completions`;
}
