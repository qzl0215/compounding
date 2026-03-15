export type GitHistoryEntry = {
  hash: string;
  date: string;
  subject: string;
};

export type GitBaselineSuggestion = {
  needsBaselineCommit: boolean;
  message: string;
  commands: string[];
};

export type PreMutationCheck = {
  branch: string;
  head_sha: string;
  has_remote: boolean;
  has_upstream: boolean;
  worktree_clean: boolean;
  sync_status: string;
  next_action: string;
  generated_at: string;
};
