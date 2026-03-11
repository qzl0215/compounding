import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { getWorkspaceRoot } from "./workspace";

export function runBootstrapCli(args: string[]) {
  const result = spawnSync("python3", ["scripts/init_project_compounding.py", ...args], {
    cwd: getWorkspaceRoot(),
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Bootstrap CLI failed");
  }

  return result.stdout.trim();
}

export async function createPromptFile(prompt: string) {
  const root = getWorkspaceRoot();
  const promptsDir = path.join(root, "output", "manual-prompts");
  await fs.mkdir(promptsDir, { recursive: true });
  const promptPath = path.join(promptsDir, `${Date.now()}.md`);
  await fs.writeFile(promptPath, prompt, "utf8");
  return path.relative(root, promptPath);
}
