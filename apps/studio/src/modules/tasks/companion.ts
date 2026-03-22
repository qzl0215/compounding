import fs from "node:fs";
import path from "node:path";

type CompanionReleaseNote = {
  release_id?: string | null;
  recorded_at?: string | null;
};

type CompanionLifecycle = {
  handoff?: {
    git_head?: string | null;
  } | null;
  release_handoff?: CompanionReleaseNote | null;
};

type CompanionContract = {
  branch_name?: string | null;
  planned_files?: string[];
  planned_modules?: string[];
};

type TaskCompanionShape = {
  current_mode?: string | null;
  lifecycle?: CompanionLifecycle;
  contract?: CompanionContract;
  artifacts?: {
    release_notes?: CompanionReleaseNote[];
  };
};

export type TaskCompanionFacts = {
  currentMode: string;
  branch: string;
  recentCommit: string;
  releaseIds: string[];
  latestReleaseId: string | null;
  plannedFiles: string[];
  plannedModules: string[];
};

export function readTaskCompanionFacts(taskId: string): TaskCompanionFacts {
  const companionPath = path.join(process.cwd(), "agent-coordination", "tasks", `${taskId}.json`);
  if (!fs.existsSync(companionPath)) {
    return {
      currentMode: "",
      branch: "",
      recentCommit: "",
      releaseIds: [],
      latestReleaseId: null,
      plannedFiles: [],
      plannedModules: [],
    };
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
    return {
      currentMode: String(companion.current_mode || "").trim(),
      branch: String(companion.contract?.branch_name || "").trim(),
      recentCommit: sanitizeCommit(companion.lifecycle?.handoff?.git_head),
      releaseIds,
      latestReleaseId: String(companion.lifecycle?.release_handoff?.release_id || "").trim() || releaseIds.at(-1) || null,
      plannedFiles: uniqueStrings(companion.contract?.planned_files ?? []),
      plannedModules: uniqueStrings(companion.contract?.planned_modules ?? []),
    };
  } catch {
    return {
      currentMode: "",
      branch: "",
      recentCommit: "",
      releaseIds: [],
      latestReleaseId: null,
      plannedFiles: [],
      plannedModules: [],
    };
  }
}

function sanitizeCommit(value: string | null | undefined) {
  return String(value || "").trim().replace(/^([0-9a-f]{7}).*$/i, "$1");
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean)));
}
