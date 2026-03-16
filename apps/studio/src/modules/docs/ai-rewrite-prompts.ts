import fs from "node:fs";
import path from "node:path";
import { getWorkspaceRoot } from "@/lib/workspace";

const workspaceRoot = getWorkspaceRoot();

export function loadPromptText(fileName: string) {
  const absolute = path.join(workspaceRoot, "docs", "prompts", fileName);
  const raw = fs.readFileSync(absolute, "utf8");
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
}
