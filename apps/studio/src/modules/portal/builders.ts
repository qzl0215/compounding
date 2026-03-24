import { getRuntimeStatusExplanation, type LocalRuntimeStatus } from "@/modules/releases";
import type {
  CockpitRuntimeSignal,
  GovernanceBucket,
  KernelShellArtifacts,
  KernelTabSnapshot,
  OverviewEntry,
  OverviewTone,
  ProjectKernelStatusSnapshot,
  ProjectOverviewDirection,
  ProjectOverviewSnapshot,
  ProjectOverviewSummary,
  ProjectTabSnapshot,
  RuntimeFacts,
} from "./types";

type SurfaceSnapshotInput = {
  workspaceLabel: string;
  workspacePath: string;
  overview: ProjectOverviewSummary;
  direction: ProjectOverviewDirection;
  runtimeFacts: RuntimeFacts;
  kernelArtifacts: KernelShellArtifacts;
  drilldowns: OverviewEntry[];
};

export function buildOverviewSummary(
  oneLiner: string,
  currentPhase: string,
  currentMilestone: string,
  currentPriority: string,
): ProjectOverviewSummary {
  return {
    oneLiner: oneLiner || "项目一句话尚未写入主源。",
    currentPhase: currentPhase || "当前阶段尚未定义。",
    currentMilestone: currentMilestone || "当前里程碑尚未定义。",
    currentPriority: currentPriority || "当前优先级尚未定义。",
  };
}

export function buildDirectionSummary(summary: string): ProjectOverviewDirection {
  return {
    summary: summary || "下一阶段方向尚未写入。",
    nextConversationAction: "先问范围、范围外、取舍、优先级和验收标准。",
    evidenceHref: "/knowledge-base?path=memory/project/roadmap.md",
  };
}

export function buildRuntimeFacts(
  pendingDevSummary: string,
  activeReleaseId: string | null,
  blockedItems: string[],
  nextCheckpoint: string[],
  frozenItems: string[],
  runtimeSignals: CockpitRuntimeSignal[],
): RuntimeFacts {
  const summary = pendingDevSummary.includes("待验收版本")
    ? "先看待验收，再决定是否继续推进。"
    : activeReleaseId
      ? `当前 production 已上线 ${activeReleaseId}。`
      : "当前还没有 production 版本。";
  return {
    summary,
    blockedItems,
    nextCheckpoint,
    runtimeSignals,
    frozenItems,
    pendingDevSummary,
    activeReleaseId,
  };
}

export function toRuntimeSignal(label: string, runtime: LocalRuntimeStatus): CockpitRuntimeSignal {
  const exp = getRuntimeStatusExplanation(runtime.status, label, runtime);
  const summary =
    runtime.status === "running" && runtime.runtime_release_id
      ? `在线：${runtime.runtime_release_id}`
      : runtime.status === "stopped"
        ? "当前未启动"
        : runtime.status === "drift"
          ? "版本与 current 不一致"
          : runtime.status === "unmanaged"
            ? "端口被非托管进程占用"
            : runtime.status === "stale_pid"
              ? "记录中的进程已失效"
              : runtime.status === "port_error"
                ? "端口或状态异常"
                : exp.explanation;
  return {
    label,
    status: exp.humanLabel,
    summary,
    href: "/releases#runtime-status",
  };
}

export function buildHomeSurfaceSnapshot({
  workspaceLabel,
  workspacePath,
  overview,
  direction,
  runtimeFacts,
  kernelArtifacts,
  drilldowns,
}: SurfaceSnapshotInput): Pick<ProjectOverviewSnapshot, "header" | "defaultTab" | "kernel" | "project"> {
  return {
    header: {
      eyebrow: "首页入口",
      title: "Kernel / Project",
      description: "先看可复用内核，再看当前项目的接入状态与执行态势。",
      workspaceLabel,
      workspacePath,
    },
    defaultTab: "project",
    kernel: buildKernelTabSnapshot(workspaceLabel, kernelArtifacts),
    project: buildProjectTabSnapshot(overview, direction, runtimeFacts, kernelArtifacts, drilldowns),
  };
}

function buildKernelTabSnapshot(workspaceLabel: string, kernelArtifacts: KernelShellArtifacts): KernelTabSnapshot {
  const version = resolveKernelVersion(kernelArtifacts);
  const currentAdoptionMode = resolveAdoptionMode(kernelArtifacts);
  return {
    identity: {
      version,
      currentAdoptionMode,
      supportedModes: ["new", "attach", "reattach"],
      summary: `单一 kernel + project shell 的 AI 工程规范，用协议主源、任务合同与受控升级维持跨项目一致性；当前仓库 ${workspaceLabel} 通过 project shell 接入。`,
      manifestPath: kernelArtifacts.paths.manifest,
    },
    entryPoints: [
      {
        label: "AGENTS",
        description: "高频执行入口，定义默认读链、执行原则和改动门禁。",
        href: "/knowledge-base?path=AGENTS.md",
        path: "AGENTS.md",
        tone: "accent",
      },
      {
        label: "WORK_MODES",
        description: "定义战略澄清、方案评审、工程执行到发布复盘的场景语义。",
        href: "/knowledge-base?path=docs/WORK_MODES.md",
        path: "docs/WORK_MODES.md",
      },
      {
        label: "DEV_WORKFLOW",
        description: "定义 pre-task、交付门禁和 release 顺序，不在首页重复解释。",
        href: "/knowledge-base?path=docs/DEV_WORKFLOW.md",
        path: "docs/DEV_WORKFLOW.md",
      },
      {
        label: "ARCHITECTURE",
        description: "定义仓库拓扑、依赖方向和运行时边界，是 kernel 的结构边界说明。",
        href: "/knowledge-base?path=docs/ARCHITECTURE.md",
        path: "docs/ARCHITECTURE.md",
      },
    ],
    governance: buildGovernanceBuckets(kernelArtifacts),
    upgradeFlow: [
      {
        id: "bootstrap",
        label: "bootstrap",
        summary: "为新项目生成最小 project shell。",
        detail: "创建 brief、协议入口和最小 memory/task/release 壳层，不复制业务实现。",
      },
      {
        id: "attach",
        label: "attach",
        summary: "把老项目接入 kernel/shell 协议边界。",
        detail: "生成或迁移 brief，并产出 bootstrap report，记录 managed/shell/protected 边界。",
      },
      {
        id: "audit",
        label: "audit",
        summary: "校验协议资产与差异分类是否仍然可信。",
        detail: "检查 brief/report/manifest、分类是否合法，以及 protected 路径是否被误纳入自动升级。",
      },
      {
        id: "proposal",
        label: "proposal",
        summary: "基于 attach/audit 结果生成受控升级提案。",
        detail: "只把 auto/proposal/suggest-only/blocked 四类差异显式列出，不替代人工判断。",
      },
    ],
    sourceHealth: {
      brief: Boolean(kernelArtifacts.brief),
      report: Boolean(kernelArtifacts.report),
      proposal: Boolean(kernelArtifacts.proposal),
      manifest: Boolean(kernelArtifacts.manifest),
    },
  };
}

function buildProjectTabSnapshot(
  overview: ProjectOverviewSummary,
  direction: ProjectOverviewDirection,
  runtimeFacts: RuntimeFacts,
  kernelArtifacts: KernelShellArtifacts,
  drilldowns: OverviewEntry[],
): ProjectTabSnapshot {
  return {
    identity: {
      name:
        kernelArtifacts.brief?.project_identity?.name ||
        kernelArtifacts.report?.project?.name ||
        "当前项目名称尚未写入 project_brief",
      oneLiner: kernelArtifacts.brief?.project_identity?.one_liner || overview.oneLiner,
      successCriteria: toStringArray(kernelArtifacts.brief?.project_identity?.success_criteria),
      adoptionMode: resolveAdoptionMode(kernelArtifacts),
      kernelVersion: resolveKernelVersion(kernelArtifacts),
    },
    execution: {
      summary: direction.summary,
      metrics: [
        { label: "当前阶段", value: overview.currentPhase, tone: "warning" },
        { label: "当前里程碑", value: overview.currentMilestone },
        { label: "当前优先级", value: overview.currentPriority, tone: "accent" },
      ],
      runtimeSignals: runtimeFacts.runtimeSignals,
      pendingDevSummary: runtimeFacts.pendingDevSummary,
      nextCheckpoint: runtimeFacts.nextCheckpoint.slice(0, 3),
      blockedItems: runtimeFacts.blockedItems.slice(0, 3),
    },
    kernelStatus: buildProjectKernelStatus(kernelArtifacts),
    boundaryGroups: [
      {
        label: "critical paths",
        items: toStringArray(kernelArtifacts.brief?.runtime_boundary?.critical_paths),
        empty: "当前未写入 critical paths。",
        tone: "accent",
      },
      {
        label: "owned paths",
        items: pickFirstNonEmpty(
          toStringArray(kernelArtifacts.brief?.local_overrides?.owned_paths),
          toStringArray(kernelArtifacts.report?.detected?.local_overrides),
        ),
        empty: "当前未记录 owned paths。",
        tone: "warning",
      },
      {
        label: "protected rules",
        items: toStringArray(kernelArtifacts.brief?.local_overrides?.protected_rules),
        empty: "当前未写入 protected rules。",
        tone: "danger",
      },
      {
        label: "blocked paths",
        items: toStringArray(kernelArtifacts.brief?.upgrade_policy?.blocked_paths),
        empty: "当前未写入 blocked paths。",
        tone: "danger",
      },
    ],
    drilldowns,
  };
}

function buildGovernanceBuckets(kernelArtifacts: KernelShellArtifacts): GovernanceBucket[] {
  return [
    buildGovernanceBucket(
      "managed",
      "managed",
      "跨项目可复用的协议与入口，应该由 kernel 主导更新。",
      kernelArtifacts.governancePresence.managed,
    ),
    buildGovernanceBucket(
      "shell",
      "shell",
      "项目自有可视化与运营素材，首页只读取，不把它们纳回 kernel。",
      kernelArtifacts.governancePresence.shell,
    ),
    buildGovernanceBucket(
      "protected",
      "protected",
      "不可自动接管的核心业务与运行边界，任何升级都必须显式避开。",
      kernelArtifacts.governancePresence.protected,
    ),
    buildGovernanceBucket(
      "generated",
      "generated",
      "由 bootstrap/attach/proposal 产出的衍生物，是 Kernel/Shell MVP 的运行痕迹。",
      kernelArtifacts.governancePresence.generated,
    ),
  ];
}

function buildGovernanceBucket(
  id: GovernanceBucket["id"],
  label: string,
  description: string,
  values: { path: string; exists: boolean }[],
): GovernanceBucket {
  const missing = values.filter((item) => !item.exists).map((item) => item.path);
  const status = values.length === 0 ? "missing" : missing.length === 0 ? "healthy" : "partial";
  const tone = status === "healthy" ? "success" : status === "partial" ? "warning" : "danger";
  const note =
    values.length === 0
      ? "当前还没有可用的 attach / manifest 资产摘要。"
      : missing.length > 0
        ? `报告中声明了 ${values.length} 项，当前缺失 ${missing.length} 项，需要继续补齐或重新 attach。`
        : "当前类别资产与仓库实物一致。";
  return {
    id,
    label,
    description,
    count: values.length,
    missingCount: missing.length,
    status,
    tone,
    highlights: values.slice(0, 3).map((item) => item.path),
    missing: missing.slice(0, 3),
    note,
  };
}

function buildProjectKernelStatus(kernelArtifacts: KernelShellArtifacts): ProjectKernelStatusSnapshot {
  const attached = kernelArtifacts.report?.status?.attached === true;
  const briefReady = Boolean(kernelArtifacts.brief);
  const reportReady = Boolean(kernelArtifacts.report);
  const proposalReady = Boolean(kernelArtifacts.proposal);
  const proposalChanges = kernelArtifacts.proposal?.changes;
  const proposalConflicts = Array.isArray(kernelArtifacts.proposal?.conflicts) ? kernelArtifacts.proposal?.conflicts : [];
  const optionalFollowups = Array.isArray(kernelArtifacts.proposal?.operator_actions?.optional_followups)
    ? kernelArtifacts.proposal?.operator_actions?.optional_followups
    : [];

  return {
    attached,
    attachScore: asNumber(kernelArtifacts.report?.status?.attach_score),
    summary:
      kernelArtifacts.report?.status?.summary ||
      (briefReady ? "当前已写入 project brief，等待继续生成 attach / proposal 产物。" : "当前还没有 kernel/shell 接入产物。"),
    steps: [
      {
        id: "attach",
        label: "attach",
        state: attached ? "recorded" : briefReady ? "ready" : "missing",
        statusLabel: attached ? "已记录" : briefReady ? "可 attach" : "待补齐",
        summary: attached
          ? "bootstrap_report 已生成，kernel/shell 边界已经被记录。"
          : briefReady
            ? "project_brief 已存在，可以继续运行 attach 生成边界报告。"
            : "先生成或迁移 bootstrap/project_brief.yaml。",
        tone: attached ? "success" : briefReady ? "accent" : "danger",
      },
      {
        id: "audit",
        label: "audit",
        state: briefReady && reportReady ? "ready" : "missing",
        statusLabel: briefReady && reportReady ? "输入完整" : "待补齐",
        summary:
          briefReady && reportReady
            ? "brief 与 bootstrap_report 已具备，可继续执行 audit 校验协议资产。"
            : "audit 依赖 brief 与 bootstrap_report 两类输入。",
        tone: briefReady && reportReady ? "accent" : "danger",
      },
      {
        id: "proposal",
        label: "proposal",
        state: proposalReady ? "recorded" : reportReady ? "ready" : "missing",
        statusLabel: proposalReady ? "已生成" : reportReady ? "可生成" : "待补齐",
        summary: proposalReady
          ? "最新 proposal 已生成，可用于查看 auto/proposal/suggest-only/blocked 四类差异。"
          : reportReady
            ? "当前已经有 attach report，可继续生成 proposal。"
            : "proposal 需要 attach/audit 的输入先完整。",
        tone: proposalReady ? "success" : reportReady ? "accent" : "danger",
      },
    ],
    proposal: {
      proposalId: asString(kernelArtifacts.proposal?.proposal_id),
      path: kernelArtifacts.proposal ? kernelArtifacts.paths.proposal : null,
      kernelVersionFrom: asString(kernelArtifacts.proposal?.kernel_version_from, "untracked"),
      kernelVersionTo: asString(kernelArtifacts.proposal?.kernel_version_to, resolveKernelVersion(kernelArtifacts)),
      autoApplyCount: countItems(proposalChanges?.auto_apply),
      proposalRequiredCount: countItems(proposalChanges?.proposal_required),
      suggestOnlyCount: countItems(proposalChanges?.suggest_only),
      blockedCount: countItems(proposalChanges?.blocked),
      conflictCount: proposalConflicts.length,
      optionalFollowupCount: optionalFollowups.length,
    },
    artifactPaths: kernelArtifacts.paths,
    artifactHealth: {
      brief: briefReady,
      report: reportReady,
      proposal: proposalReady,
      manifest: Boolean(kernelArtifacts.manifest),
    },
  };
}

function resolveKernelVersion(kernelArtifacts: KernelShellArtifacts) {
  return (
    kernelArtifacts.report?.kernel?.version ||
    kernelArtifacts.brief?.kernel?.version ||
    kernelArtifacts.manifest?.version ||
    "untracked"
  );
}

function resolveAdoptionMode(kernelArtifacts: KernelShellArtifacts) {
  return kernelArtifacts.brief?.kernel?.adoption_mode || kernelArtifacts.report?.kernel?.adoption_mode || "untracked";
}

function countItems(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function pickFirstNonEmpty(...values: string[][]) {
  return values.find((items) => items.length > 0) || [];
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function toneToAccentClass(tone: OverviewTone) {
  if (tone === "success") {
    return "text-success";
  }
  if (tone === "warning") {
    return "text-amber-200";
  }
  if (tone === "danger") {
    return "text-danger";
  }
  if (tone === "accent") {
    return "text-accent";
  }
  return "text-white";
}
