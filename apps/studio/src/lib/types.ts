export type RuntimeBoundary = "server-only" | "local-only" | "hybrid";

export type EnabledModules = {
  ui_system: boolean;
  server_truth_ledger: boolean;
  quant_review: boolean;
  evidence_boundary: boolean;
  anti_entropy: boolean;
  tech_debt: boolean;
};

export type OrgRole = {
  department: string;
  role: string;
  responsibilities: string[];
  reports_to: string;
  scope: string[];
};

export type DecisionPolicy = {
  tiers: Array<{
    name: string;
    proposer: string;
    approver: string;
    examples: string[];
  }>;
};

export type ReportingContract = {
  default_sections: string[];
  required_fields: string[];
};

export type RepoScanSummary = {
  languages: string[];
  package_manager: string;
  main_directories: string[];
  build_command: string;
  test_command: string;
  lanes: Record<string, string>;
  hot_files: string[];
};

export type ProjectBrief = {
  project_name: string;
  project_one_liner: string;
  success_definition: string;
  current_priority: string;
  must_protect: string[];
  runtime_boundary: RuntimeBoundary;
};

export type ProjectBriefSchema = {
  title: string;
  type: "object";
  properties: Record<
    string,
    {
      type?: string;
      title?: string;
      description?: string;
      enum?: string[];
      items?: { type?: string };
      default?: unknown;
      "x-group"?: string;
      "x-step"?: number;
      "x-widget"?: string;
    }
  >;
  required?: string[];
};

export type BootstrapConfig = {
  project_name: string;
  project_slug: string;
  project_one_liner: string;
  default_language: string;
  repo_kind: string;
  scm_flow: string;
  runtime_boundary: RuntimeBoundary;
  success_definition: string;
  current_priority: string;
  must_protect: string[];
  primary_goals: string[];
  primary_chains: string[];
  allowed_scopes: string[];
  frozen_items: string[];
  high_risk_actions: string[];
  lanes: Record<string, string>;
  hot_files: string[];
  validation_modes: string[];
  enabled_modules: EnabledModules;
  template_profile: string;
  company_mission: string;
  company_vision: string;
  company_values: string[];
  operating_principles: string[];
  org_structure: OrgRole[];
  decision_policy: DecisionPolicy;
  reporting_contract: ReportingContract;
  knowledge_domains: string[];
  north_star_metric: string;
  short_term_priorities: string[];
  long_term_compounding_axes: string[];
  rewrite_policy: string;
  version_policy: string;
  ui_preferences: string;
  repo_scan: RepoScanSummary;
};

export type ProposalTargetBlock = {
  file_path: string;
  block_name: string;
  action_type: "canonical_update" | "ratified_note_append";
  change_intent: string;
  before_content: string;
  after_content: string;
  before_hash: string;
  after_hash: string;
};

export type ProposalValidationSummary = {
  base_revision: string;
  git_ready: boolean;
  dirty_worktree: boolean;
  staged_changes: boolean;
  target_block_count: number;
};

export type Proposal = {
  id: string;
  created_at: string;
  prompt: string;
  action_type: "canonical_update" | "ratified_note_append";
  affected_files: string[];
  target_blocks: ProposalTargetBlock[];
  diff_summary: string;
  risk_notes: string[];
  status: "pending" | "applied";
  validation_summary: ProposalValidationSummary;
  base_revision: string;
  apply_commit_message: string;
};

export type ReviewSummary = {
  id: string;
  goal: string;
  impact_summary: string;
  risk_level: "low" | "medium" | "high";
  touched_files: string[];
  acceptance_note: string;
  requires_manual_review: boolean;
  diff_excerpt: string;
};

export type ProposalBundle = {
  proposal: Proposal;
  diff: string;
  candidateFiles: Record<string, string>;
  reviewSummary: ReviewSummary;
};

export type TaskBrief = {
  task_goal: string;
  expected_output: string;
  notes: string;
  resolved_constraints: string[];
  suggested_context: string[];
  acceptance_criteria: string[];
  review_mode: string;
  agent_prompt: string;
};

export type AuditResult = {
  passed: boolean;
  errors: string[];
  warnings: string[];
  checked_files: string[];
  missing_assets: string[];
  conflicting_rules: string[];
  hardcoded_legacy_terms: string[];
};

export type DocMeta = {
  title: string;
  owner_role: string;
  status: string;
  last_reviewed_at: string;
  source_of_truth: string;
  related_docs: string[];
};

export type DocNode = {
  name: string;
  path: string;
  children?: DocNode[];
};

export type FieldErrors = Record<string, string>;

export type ConfigValidationResult = {
  ok: boolean;
  message: string;
  field_errors: FieldErrors;
  saved_at?: string;
};

export type PipelineSummary = {
  generated_at?: string;
  note?: string;
  docs_count?: number;
  proposal_count?: number;
  next_focus?: string;
};

export type GitBaselineSuggestion = {
  needsBaselineCommit: boolean;
  message: string;
  commands: string[];
};
