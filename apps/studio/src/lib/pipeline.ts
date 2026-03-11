import fs from "node:fs/promises";
import path from "node:path";
import type { PipelineSummary } from "./types";
import { getWorkspaceRoot } from "./workspace";

async function readJsonIfPresent(relativePath: string): Promise<PipelineSummary | null> {
  try {
    const absolute = path.join(getWorkspaceRoot(), relativePath);
    const raw = await fs.readFile(absolute, "utf8");
    return JSON.parse(raw) as PipelineSummary;
  } catch {
    return null;
  }
}

export async function readPipelineSummaries() {
  const [serverTruth, quantReview] = await Promise.all([
    readJsonIfPresent("output/pipeline/state/server_truth_ledger/latest.json"),
    readJsonIfPresent("output/pipeline/state/foreman_quant_review/latest.json")
  ]);

  return { serverTruth, quantReview };
}
