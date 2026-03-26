import fs from "node:fs";
import path from "node:path";
import { parseTaskContract } from "../../../../../shared/task-contract";
import type { ReleaseDeliverySnapshot, ResolvedTaskContractSummary } from "./types";

function firstMeaningful(value: string | null | undefined) {
  return (
    String(value || "")
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .find(Boolean) || null
  );
}

function resolveWorkspacePath(relativePath: string) {
  const candidates = [
    path.join(process.cwd(), relativePath),
    path.resolve(process.cwd(), "..", "..", relativePath),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

export function normalizeDeliverySnapshot(
  snapshot?: Partial<ReleaseDeliverySnapshot> | null,
  legacySummary?: string | null,
  legacyRisk?: string | null
): ReleaseDeliverySnapshot | null {
  const normalized = {
    summary: firstMeaningful(snapshot?.summary || legacySummary),
    risk: firstMeaningful(snapshot?.risk || legacyRisk),
    done_when: firstMeaningful(snapshot?.done_when),
    change_cost: snapshot?.change_cost || null,
  };
  if (!normalized.summary && !normalized.risk && !normalized.done_when && !normalized.change_cost) {
    return null;
  }
  return normalized;
}

export function resolveTaskContractSummary(taskId: string | null): ResolvedTaskContractSummary | null {
  if (!taskId) {
    return null;
  }
  const taskPath = `tasks/queue/${taskId}.md`;
  const absolutePath = resolveWorkspacePath(taskPath);
  if (!fs.existsSync(absolutePath)) {
    return null;
  }
  const content = fs.readFileSync(absolutePath, "utf8");
  const parsed = parseTaskContract(taskPath, content);
  return {
    task_id: parsed.id,
    task_path: parsed.path,
    short_id: parsed.shortId,
    title: parsed.title,
    summary: firstMeaningful(parsed.summary),
    risk: firstMeaningful(parsed.risk),
    done_when: firstMeaningful(parsed.doneWhen),
  };
}
