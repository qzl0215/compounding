export type HomeEntryLink = {
  href: string;
  label: string;
  description: string;
  scope: "agents" | "roadmap" | "memory" | "tasks" | "release";
};

export type SemanticEntry = {
  label: string;
  path?: string;
  href?: string;
  description?: string;
};

export type SemanticEntryGroup = {
  title: string;
  description?: string;
  items: SemanticEntry[];
};

export type ProjectOverviewSummary = {
  oneLiner: string;
  currentPhase: string;
  currentMilestone: string;
  currentPriority: string;
};

export type ProjectOverviewDirection = {
  summary: string;
  nextConversationAction: string;
  evidenceHref: string;
};

export type CockpitRuntimeSignal = {
  label: string;
  status: string;
  summary: string;
  href: string;
};

export type DemandStage = "thinking" | "planning" | "ready" | "doing" | "acceptance" | "released";

export type DemandStageItem = {
  id: string;
  title: string;
  source: string;
  stage: DemandStage;
  summary: string;
  nextConversationAction: string;
  evidenceHref: string;
  taskId?: string;
  badge?: string;
};

export type RuntimeFacts = {
  summary: string;
  blockedItems: string[];
  nextCheckpoint: string[];
  runtimeSignals: CockpitRuntimeSignal[];
  frozenItems: string[];
  pendingDevSummary: string;
  activeReleaseId: string | null;
};

export type HomeTabId = "project" | "kernel";
export type OverviewTone = "default" | "accent" | "success" | "warning" | "danger";

export type HomeHeaderSnapshot = {
  eyebrow: string;
  title: string;
  description: string;
  workspaceLabel: string;
  workspacePath: string;
};

export type OverviewEntry = {
  label: string;
  description: string;
  href?: string;
  path?: string;
  meta?: string;
  tone?: OverviewTone;
};

export type AssetPresence = {
  path: string;
  exists: boolean;
};

export type GovernanceBucketId = "managed" | "shell" | "protected" | "generated";
export type GovernanceBucketStatus = "healthy" | "partial" | "missing";

export type GovernanceBucket = {
  id: GovernanceBucketId;
  label: string;
  description: string;
  count: number;
  missingCount: number;
  status: GovernanceBucketStatus;
  tone: OverviewTone;
  highlights: string[];
  missing: string[];
  note: string;
};

export type UpgradeFlowStep = {
  id: "bootstrap" | "attach" | "audit" | "proposal";
  label: string;
  summary: string;
  detail: string;
};

export type KernelTabSnapshot = {
  identity: {
    version: string;
    currentAdoptionMode: string;
    supportedModes: string[];
    summary: string;
    manifestPath: string;
  };
  entryPoints: OverviewEntry[];
  governance: GovernanceBucket[];
  upgradeFlow: UpgradeFlowStep[];
  sourceHealth: {
    brief: boolean;
    report: boolean;
    proposal: boolean;
    manifest: boolean;
  };
};

export type ProjectExecutionMetric = {
  label: string;
  value: string;
  detail?: string;
  tone?: OverviewTone;
};

export type ProjectStepState = "recorded" | "ready" | "missing";

export type ProjectStepStatus = {
  id: "attach" | "audit" | "proposal";
  label: string;
  state: ProjectStepState;
  statusLabel: string;
  summary: string;
  tone: OverviewTone;
};

export type ProposalChangeSummary = {
  proposalId: string | null;
  path: string | null;
  kernelVersionFrom: string;
  kernelVersionTo: string;
  autoApplyCount: number;
  proposalRequiredCount: number;
  suggestOnlyCount: number;
  blockedCount: number;
  conflictCount: number;
  optionalFollowupCount: number;
};

export type ProjectKernelStatusSnapshot = {
  attached: boolean;
  attachScore: number | null;
  summary: string;
  steps: ProjectStepStatus[];
  proposal: ProposalChangeSummary;
  artifactPaths: {
    brief: string;
    report: string;
    proposal: string;
    manifest: string;
  };
  artifactHealth: {
    brief: boolean;
    report: boolean;
    proposal: boolean;
    manifest: boolean;
  };
};

export type ProjectIdentitySnapshot = {
  name: string;
  oneLiner: string;
  successCriteria: string[];
  adoptionMode: string;
  kernelVersion: string;
};

export type ProjectBoundaryGroup = {
  label: string;
  items: string[];
  empty: string;
  tone: OverviewTone;
};

export type ProjectTabSnapshot = {
  identity: ProjectIdentitySnapshot;
  execution: {
    summary: string;
    metrics: ProjectExecutionMetric[];
    runtimeSignals: CockpitRuntimeSignal[];
    pendingDevSummary: string;
    nextCheckpoint: string[];
    blockedItems: string[];
  };
  kernelStatus: ProjectKernelStatusSnapshot;
  boundaryGroups: ProjectBoundaryGroup[];
  drilldowns: OverviewEntry[];
};

export type ProjectBriefPayload = {
  project_identity?: {
    name?: string;
    one_liner?: string;
    success_criteria?: unknown[];
  };
  kernel?: {
    version?: string;
    adoption_mode?: string;
  };
  runtime_boundary?: {
    app_type?: string;
    deploy_target?: string;
    critical_paths?: unknown[];
  };
  local_overrides?: {
    owned_paths?: unknown[];
    protected_rules?: unknown[];
  };
  upgrade_policy?: {
    auto_apply_paths?: unknown[];
    proposal_required_paths?: unknown[];
    blocked_paths?: unknown[];
  };
};

export type BootstrapReportPayload = {
  project?: {
    name?: string;
    path?: string;
  };
  kernel?: {
    version?: string;
    adoption_mode?: string;
  };
  status?: {
    attached?: boolean;
    attach_score?: number;
    summary?: string;
  };
  detected?: {
    managed_assets?: unknown[];
    shell_assets?: unknown[];
    protected_assets?: unknown[];
    local_overrides?: unknown[];
  };
  actions?: {
    created?: unknown[];
    skipped?: unknown[];
    needs_proposal?: unknown[];
    warnings?: unknown[];
  };
};

export type ProposalPayload = {
  proposal_id?: string;
  kernel_version_from?: string;
  kernel_version_to?: string;
  changes?: {
    auto_apply?: unknown[];
    proposal_required?: unknown[];
    suggest_only?: unknown[];
    blocked?: unknown[];
  };
  conflicts?: unknown[];
  operator_actions?: {
    must_confirm?: unknown[];
    optional_followups?: unknown[];
  };
};

export type KernelManifestPayload = {
  version?: string;
  managed_assets?: unknown[];
  shell_assets?: unknown[];
  generated_assets?: unknown[];
  protected_assets?: unknown[];
};

export type KernelShellArtifacts = {
  paths: {
    brief: string;
    report: string;
    proposal: string;
    manifest: string;
  };
  brief: ProjectBriefPayload | null;
  report: BootstrapReportPayload | null;
  proposal: ProposalPayload | null;
  manifest: KernelManifestPayload | null;
  governancePresence: {
    managed: AssetPresence[];
    shell: AssetPresence[];
    protected: AssetPresence[];
    generated: AssetPresence[];
  };
};

export type ProjectOverviewSnapshot = {
  overview: ProjectOverviewSummary;
  direction: ProjectOverviewDirection;
  thinkingItems: DemandStageItem[];
  planningItems: DemandStageItem[];
  readyItems: DemandStageItem[];
  doingItems: DemandStageItem[];
  acceptanceItems: DemandStageItem[];
  releasedItems: DemandStageItem[];
  runtimeFacts: RuntimeFacts;
  header: HomeHeaderSnapshot;
  defaultTab: HomeTabId;
  kernel: KernelTabSnapshot;
  project: ProjectTabSnapshot;
};
