import type {
  GovernanceBucket,
  KernelShellArtifacts,
  KernelTabSnapshot,
} from "../types";

export function buildKernelTabSnapshot(workspaceLabel: string, kernelArtifacts: KernelShellArtifacts): KernelTabSnapshot {
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

export function buildGovernanceBuckets(kernelArtifacts: KernelShellArtifacts): GovernanceBucket[] {
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

export function resolveKernelVersion(kernelArtifacts: KernelShellArtifacts) {
  return (
    kernelArtifacts.report?.kernel?.version ||
    kernelArtifacts.brief?.kernel?.version ||
    kernelArtifacts.manifest?.version ||
    "untracked"
  );
}

export function resolveAdoptionMode(kernelArtifacts: KernelShellArtifacts) {
  return kernelArtifacts.brief?.kernel?.adoption_mode || kernelArtifacts.report?.kernel?.adoption_mode || "untracked";
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
