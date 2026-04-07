const fs = require("node:fs");
const path = require("node:path");
const { loadPromptManifest } = require("./lib/knowledge-assets.ts");

const root = process.cwd();

const SUPPORTING_FILES = [
  "docs/prompts/prompt-assets.json",
  "apps/studio/src/app/api/docs/ai-rewrite/route.ts",
  "apps/studio/src/modules/docs/ai-rewrite.ts",
  "apps/studio/src/modules/docs/ai-rewrite-context.ts",
  "apps/studio/src/modules/docs/ai-rewrite-provider.ts",
  "apps/studio/src/modules/docs/ai-rewrite-prompts.ts",
];

function readEnvFile(fileName) {
  const absolute = path.join(root, fileName);
  if (!fs.existsSync(absolute)) {
    return {};
  }
  const env = {};
  for (const raw of fs.readFileSync(absolute, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }
    const [key, ...rest] = line.split("=");
    let value = rest.join("=").trim();
    if (value.length >= 2 && value[0] === value[value.length - 1] && [`"`, `'`].includes(value[0])) {
      value = value.slice(1, -1);
    }
    env[key.trim()] = value;
  }
  return env;
}

function readEnvValue(fileEnv, ...keys) {
  for (const key of keys) {
    if (process.env[key]) {
      return process.env[key];
    }
  }
  for (const key of keys) {
    if (fileEnv[key]) {
      return fileEnv[key];
    }
  }
  return null;
}

function validatePrompts(errors, details) {
  const promptSpecs = loadPromptManifest(root).map((item) => ({
    path: `docs/prompts/${item.file}`,
    required: Array.isArray(item.required_sections) ? item.required_sections : [],
    id: item.id,
  }));

  if (promptSpecs.length === 0) {
    errors.push("Prompt asset manifest is missing or empty: docs/prompts/prompt-assets.json");
    return;
  }

  for (const spec of promptSpecs) {
    const absolute = path.join(root, spec.path);
    if (!fs.existsSync(absolute)) {
      errors.push(`Missing prompt asset: ${spec.path}`);
      continue;
    }
    const content = fs.readFileSync(absolute, "utf8");
    if (!content.trim()) {
      errors.push(`Prompt asset is empty: ${spec.path}`);
      continue;
    }
    for (const marker of spec.required) {
      if (!content.includes(marker)) {
        errors.push(`Prompt asset missing section "${marker}": ${spec.path}`);
      }
    }
    details.prompts.push({ id: spec.id, path: spec.path });
  }
}

function validateSupportingFiles(errors, details) {
  for (const relative of SUPPORTING_FILES) {
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) {
      errors.push(`Missing AI output support file: ${relative}`);
      continue;
    }
    details.supporting_files.push(relative);
  }
}

function validateProvider(errors, warnings, details) {
  const fileEnv = { ...readEnvFile(".env"), ...readEnvFile(".env.local") };
  const apiKey = readEnvValue(fileEnv, "ARK_API_KEY", "VOLCANO_API_KEY", "OPENAI_API_KEY");
  const model = readEnvValue(fileEnv, "ARK_MODEL", "MODEL_NAME", "VOLCANO_MODEL_ID", "OPENAI_MODEL");
  const baseUrl =
    readEnvValue(fileEnv, "ARK_BASE_URL", "VOLCANO_BASE_URL", "OPENAI_BASE_URL") ||
    "https://ark.cn-beijing.volces.com/api/v3";

  details.provider = {
    configured: Boolean(apiKey && model),
    partial: Boolean(apiKey || model) && !(apiKey && model),
    base_url: baseUrl,
  };

  if ((apiKey && !model) || (!apiKey && model)) {
    errors.push("AI provider configuration is partial: API key and model must be configured together.");
    return;
  }

  if (!apiKey && !model) {
    warnings.push("AI provider is not configured; AI output layer only validated prompt and route assets.");
  }
}

const errors = [];
const warnings = [];
const details = { prompts: [], supporting_files: [], provider: null };

validatePrompts(errors, details);
validateSupportingFiles(errors, details);
validateProvider(errors, warnings, details);

console.log(
  JSON.stringify(
    {
      ok: errors.length === 0,
      layer: "ai-output",
      errors,
      warnings,
      details,
    },
    null,
    2
  )
);

if (errors.length > 0) {
  process.exit(1);
}
