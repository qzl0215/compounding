import type {
  KernelShellArtifacts,
  OverviewEntry,
  ProjectKernelStatusSnapshot,
  ProjectOverviewDirection,
  ProjectOverviewSummary,
  ProjectTabSnapshot,
  RuntimeFacts,
} from "../types";
import { asNumber, asString, countItems, pickFirstNonEmpty, toStringArray } from "./shared";
import { resolveAdoptionMode, resolveKernelVersion } from "./kernel-tab";

export function buildProjectTabSnapshot(
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
