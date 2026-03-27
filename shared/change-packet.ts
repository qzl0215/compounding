export type ChangeObservationMode = "worktree" | "recent";

export type ChangeSource = "none" | "worktree" | "recent_commit";

export type ChangeClass = "light" | "structural" | "release";

export type ChangeClassificationRule =
  | "no_observed_changes"
  | "all_light_files"
  | "has_release_files"
  | "has_non_light_non_release_files";

export type ChangeObservationProbe = "git_status" | "head_parent_diff";

export type ChangePolicy = {
  requires_task: boolean;
  requires_pre_task: boolean;
  requires_release_handoff: boolean;
  strict_task_binding: boolean;
};

export type ChangeObservationBasis = {
  sources_checked: ChangeObservationProbe[];
  selected_source: ChangeSource;
  selected_ref: string | null;
  ignored_prefixes: string[];
};

export type ChangeEvidence = {
  observation_basis: ChangeObservationBasis;
  classification_rule: ChangeClassificationRule;
  matched_files: string[];
  light_files: string[];
  release_files: string[];
  other_files: string[];
};

export type ChangePacket = {
  observation_mode: ChangeObservationMode;
  change_source: ChangeSource;
  changed_files: string[];
  change_class: ChangeClass;
  policy: ChangePolicy;
  change_reason: string;
  change_evidence: ChangeEvidence;
};
