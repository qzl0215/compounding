import fs from "node:fs";
import path from "node:path";
import { getWorkspaceRoot } from "@/lib/workspace";

const workspaceRoot = getWorkspaceRoot();
const promptManifestPath = path.join(workspaceRoot, "docs", "prompts", "prompt-assets.json");

export function loadPromptText(fileName: string) {
  const absolute = path.join(workspaceRoot, "docs", "prompts", resolvePromptFile(fileName));
  const raw = fs.readFileSync(absolute, "utf8");
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
}

function resolvePromptFile(promptKey: string) {
  if (!fs.existsSync(promptManifestPath)) {
    return promptKey;
  }
  const manifest = JSON.parse(fs.readFileSync(promptManifestPath, "utf8")) as Array<{
    id?: string;
    file?: string;
  }>;
  return manifest.find((item) => item.id === promptKey || item.file === promptKey)?.file || promptKey;
}
