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

type CompanionLock = {
  target?: string | null;
};

type TaskCompanionShape = {
  task_id?: string | null;
  task_path?: string | null;
  contract_hash?: string | null;
  current_mode?: string | null;
  branch_name?: string | null;
  planned_files?: string[];
  planned_modules?: string[];
  locks?: CompanionLock[];
  lifecycle?: CompanionLifecycle;
  artifacts?: {
    decision_cards?: { path?: string | null }[];
    diff_summaries?: { path?: string | null }[];
    release_notes?: CompanionReleaseNote[];
  };
};

export type TaskCompanionFacts = {
  currentMode: string;
  contractHash: string;
  branch: string;
  recentCommit: string;
  releaseIds: string[];
  latestReleaseId: string | null;
  plannedFiles: string[];
  plannedModules: string[];
  locks: string[];
  artifactRefs: string[];
};

export function readTaskCompanionFacts(taskId: string): TaskCompanionFacts {
  const companionPath = path.join(process.cwd(), "agent-coordination", "tasks", `${taskId}.json`);
  if (!fs.existsSync(companionPath)) {
    return {
      currentMode: "",
      contractHash: "",
      branch: "",
      recentCommit: "",
      releaseIds: [],
      latestReleaseId: null,
      plannedFiles: [],
      plannedModules: [],
      locks: [],
      artifactRefs: [],
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
      contractHash: String(companion.contract_hash || "").trim(),
      branch: String(companion.branch_name || "").trim(),
      recentCommit: sanitizeCommit(companion.lifecycle?.handoff?.git_head),
      releaseIds,
      latestReleaseId: String(companion.lifecycle?.release_handoff?.release_id || "").trim() || releaseIds.at(-1) || null,
      plannedFiles: uniqueStrings(companion.planned_files ?? []),
      plannedModules: uniqueStrings(companion.planned_modules ?? []),
      locks: uniqueStrings((companion.locks ?? []).map((lock) => String(lock?.target || "").trim())),
      artifactRefs: uniqueStrings([
        ...(companion.artifacts?.decision_cards ?? []).map((item) => String(item?.path || "").trim()),
        ...(companion.artifacts?.diff_summaries ?? []).map((item) => String(item?.path || "").trim()),
      ]),
    };
  } catch {
    return {
      currentMode: "",
      contractHash: "",
      branch: "",
      recentCommit: "",
      releaseIds: [],
      latestReleaseId: null,
      plannedFiles: [],
      plannedModules: [],
      locks: [],
      artifactRefs: [],
    };
  }
}

function sanitizeCommit(value: string | null | undefined) {
  return String(value || "").trim().replace(/^([0-9a-f]{7}).*$/i, "$1");
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean)));
}
