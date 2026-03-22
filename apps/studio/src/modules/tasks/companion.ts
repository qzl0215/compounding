import fs from "node:fs";
import path from "node:path";

type CompanionReleaseNote = {
  release_id?: string | null;
  recorded_at?: string | null;
};

type TaskCompanionShape = {
  lifecycle?: {
    release_handoff?: CompanionReleaseNote | null;
  };
  artifacts?: {
    release_notes?: CompanionReleaseNote[];
  };
};

export type TaskCompanionReleaseInfo = {
  releaseIds: string[];
  latestReleaseId: string | null;
};

export function readTaskCompanionReleaseInfo(taskId: string): TaskCompanionReleaseInfo {
  const companionPath = path.join(process.cwd(), "agent-coordination", "tasks", `${taskId}.json`);
  if (!fs.existsSync(companionPath)) {
    return { releaseIds: [], latestReleaseId: null };
  }

  try {
    const companion = JSON.parse(fs.readFileSync(companionPath, "utf8")) as TaskCompanionShape;
    const notes = companion.artifacts?.release_notes ?? [];
    const releaseIds = Array.from(
      new Set(
        notes
          .map((note) => String(note?.release_id || "").trim())
          .filter(Boolean)
      )
    );
    const latestReleaseId = String(companion.lifecycle?.release_handoff?.release_id || "").trim() || releaseIds.at(-1) || null;
    return { releaseIds, latestReleaseId };
  } catch {
    return { releaseIds: [], latestReleaseId: null };
  }
}
