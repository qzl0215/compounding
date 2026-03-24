import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeDashboard } from "../components/home-dashboard";
import type { ProjectOverviewSnapshot } from "../types";

const overviewFixture: ProjectOverviewSnapshot = {
  overview: {
    oneLiner: "把仓库升级成适合长期协作的 AI-Native Repo。",
    currentPhase: "Kernel / Project Home Refactor",
    currentPriority: "先让首页能分开看内核规范和项目态势。",
    currentMilestone: "首页双 Tab",
  },
  direction: {
    summary: "把首页拆成 Kernel / Project 双视图。",
    nextConversationAction: "先确认双视图边界。",
    evidenceHref: "/knowledge-base?path=memory/project/roadmap.md",
  },
  thinkingItems: [],
  planningItems: [],
  readyItems: [],
  doingItems: [],
  acceptanceItems: [],
  releasedItems: [],
  runtimeFacts: {
    summary: "需求判断和运行判断要一起看。",
    blockedItems: ["当前没有结构性阻塞。"],
    nextCheckpoint: ["完成首页 UI。"],
    runtimeSignals: [
      {
        label: "dev 预览",
        status: "运行中",
        summary: "dev 当前在线，可继续验收。",
        href: "/releases#runtime-status",
      },
      {
        label: "production",
        status: "未启动",
        summary: "production 当前未启动。",
        href: "/releases#runtime-status",
      },
    ],
    frozenItems: ["不新增数据库"],
    pendingDevSummary: "当前没有待验收 dev。",
    activeReleaseId: "rel-prod",
  },
  header: {
    eyebrow: "首页入口",
    title: "Kernel / Project",
    description: "先看可复用内核，再看当前项目的接入状态与执行态势。",
    workspaceLabel: "Compounding",
    workspacePath: "/tmp/compounding",
  },
  defaultTab: "project",
  project: {
    identity: {
      name: "Compounding AI Operating System",
      oneLiner: "项目级读模型与内核规范拆分。",
      successCriteria: ["首页双 Tab 稳定工作", "Project 默认激活"],
      adoptionMode: "attach",
      kernelVersion: "0.1.0",
    },
    execution: {
      summary: "把项目执行态势和内核规范拆开。",
      metrics: [
        { label: "当前阶段", value: "Kernel / Project Home Refactor", tone: "warning" },
        { label: "当前里程碑", value: "首页双 Tab" },
        { label: "当前优先级", value: "实现 Project 默认激活", tone: "accent" },
      ],
      runtimeSignals: [
        {
          label: "dev 预览",
          status: "运行中",
          summary: "dev 当前在线，可继续验收。",
          href: "/releases#runtime-status",
        },
        {
          label: "production",
          status: "未启动",
          summary: "production 当前未启动。",
          href: "/releases#runtime-status",
        },
      ],
      pendingDevSummary: "当前没有待验收 dev。",
      nextCheckpoint: ["完成 Project 视图"],
      blockedItems: ["当前没有结构性阻塞。"],
    },
    kernelStatus: {
      attached: true,
      attachScore: 100,
      summary: "Legacy attach completed with kernel/shell boundaries recorded and proposal inputs prepared.",
      steps: [
        {
          id: "attach",
          label: "attach",
          state: "recorded",
          statusLabel: "已记录",
          summary: "bootstrap_report 已生成。",
          tone: "success",
        },
        {
          id: "audit",
          label: "audit",
          state: "ready",
          statusLabel: "输入完整",
          summary: "brief 与 report 已具备。",
          tone: "accent",
        },
        {
          id: "proposal",
          label: "proposal",
          state: "recorded",
          statusLabel: "已生成",
          summary: "proposal 已落盘。",
          tone: "success",
        },
      ],
      proposal: {
        proposalId: "20260324171742142872",
        path: "output/proposals/20260324171742142872/proposal.yaml",
        kernelVersionFrom: "untracked",
        kernelVersionTo: "0.1.0",
        autoApplyCount: 0,
        proposalRequiredCount: 0,
        suggestOnlyCount: 3,
        blockedCount: 4,
        conflictCount: 0,
        optionalFollowupCount: 6,
      },
      artifactPaths: {
        brief: "bootstrap/project_brief.yaml",
        report: "output/bootstrap/bootstrap_report.yaml",
        proposal: "output/proposals/20260324171742142872/proposal.yaml",
        manifest: "kernel/kernel_manifest.yaml",
      },
      artifactHealth: {
        brief: true,
        report: true,
        proposal: true,
        manifest: false,
      },
    },
    boundaryGroups: [
      { label: "critical paths", items: ["AGENTS.md"], empty: "当前未写入 critical paths。", tone: "accent" },
      { label: "owned paths", items: ["apps/**"], empty: "当前未记录 owned paths。", tone: "warning" },
      { label: "protected rules", items: ["禁止自动修改核心业务代码"], empty: "当前未写入 protected rules。", tone: "danger" },
      { label: "blocked paths", items: ["deploy/**"], empty: "当前未写入 blocked paths。", tone: "danger" },
    ],
    drilldowns: [
      { label: "执行面板", description: "看真正可推进的事项。", href: "/tasks", tone: "accent" },
      { label: "最新 Proposal", description: "当前 kernel/shell 提案已落盘。", path: "output/proposals/20260324171742142872/proposal.yaml" },
    ],
  },
  kernel: {
    identity: {
      version: "0.1.0",
      currentAdoptionMode: "attach",
      supportedModes: ["new", "attach", "reattach"],
      summary: "单一 kernel + project shell 的 AI 工程规范。",
      manifestPath: "kernel/kernel_manifest.yaml",
    },
    entryPoints: [
      { label: "AGENTS", description: "高频执行入口", href: "/knowledge-base?path=AGENTS.md", tone: "accent" },
      { label: "WORK_MODES", description: "场景语义", href: "/knowledge-base?path=docs/WORK_MODES.md" },
      { label: "DEV_WORKFLOW", description: "交付门禁", href: "/knowledge-base?path=docs/DEV_WORKFLOW.md" },
      { label: "ARCHITECTURE", description: "运行边界", href: "/knowledge-base?path=docs/ARCHITECTURE.md" },
    ],
    governance: [
      {
        id: "managed",
        label: "managed",
        description: "跨项目复用资产",
        count: 20,
        missingCount: 10,
        status: "partial",
        tone: "warning",
        highlights: ["AGENTS.md"],
        missing: ["kernel/kernel_manifest.yaml"],
        note: "报告与仓库实物还没完全对齐。",
      },
      {
        id: "shell",
        label: "shell",
        description: "项目自有资产",
        count: 3,
        missingCount: 0,
        status: "healthy",
        tone: "success",
        highlights: ["apps/**"],
        missing: [],
        note: "当前 shell 资产健康。",
      },
      {
        id: "protected",
        label: "protected",
        description: "受保护资产",
        count: 4,
        missingCount: 0,
        status: "healthy",
        tone: "success",
        highlights: ["deploy/**"],
        missing: [],
        note: "当前 protected 资产健康。",
      },
      {
        id: "generated",
        label: "generated",
        description: "衍生产物",
        count: 3,
        missingCount: 1,
        status: "partial",
        tone: "warning",
        highlights: ["bootstrap/project_brief.yaml"],
        missing: ["output/proposals/*/proposal.yaml"],
        note: "仍有待补齐产物。",
      },
    ],
    upgradeFlow: [
      { id: "bootstrap", label: "bootstrap", summary: "生成最小 shell", detail: "为新项目起壳。" },
      { id: "attach", label: "attach", summary: "接入老项目", detail: "记录边界。" },
      { id: "audit", label: "audit", summary: "校验协议", detail: "检查分类。" },
      { id: "proposal", label: "proposal", summary: "生成提案", detail: "输出四类差异。" },
    ],
    sourceHealth: {
      brief: true,
      report: true,
      proposal: true,
      manifest: false,
    },
  },
};

describe("home dashboard", () => {
  it("defaults to the project tab and renders project-specific panels", () => {
    render(<HomeDashboard overview={overviewFixture} />);

    expect(screen.getByRole("heading", { name: "Kernel / Project" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Project/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Compounding AI Operating System")).toBeInTheDocument();
    expect(screen.getByText("attach / audit / proposal")).toBeInTheDocument();
    expect(screen.queryByText("canonical entry points")).not.toBeInTheDocument();
  });

  it("switches to the kernel tab and renders kernel governance panels", () => {
    render(<HomeDashboard overview={overviewFixture} />);

    fireEvent.click(screen.getByRole("tab", { name: /Kernel/ }));

    expect(screen.getByRole("tab", { name: /Kernel/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("canonical entry points")).toBeInTheDocument();
    expect(screen.getByText("managed / shell / protected / generated")).toBeInTheDocument();
    expect(screen.getByText("bootstrap → attach → audit → proposal")).toBeInTheDocument();
  });
});
