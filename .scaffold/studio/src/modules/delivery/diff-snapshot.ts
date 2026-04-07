export type DiffSnapshotSourceMode = "worktree" | "branch_vs_main" | "recent_commit" | "none";

export type DiffStats = {
  files: number;
  insertions: number;
  deletions: number;
};

export type DiffSnapshot = {
  source_mode: DiffSnapshotSourceMode;
  range_ref: string | null;
  changed_files: string[];
  stats: DiffStats;
};
