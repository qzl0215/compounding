import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeDashboard } from "../components/home-dashboard";
import type { ProjectOverviewSnapshot } from "../types";

const cockpitFixture: ProjectOverviewSnapshot = {
  overview: {
    oneLiner: "把仓库升级成适合长期协作的 AI-Native Repo。",
    currentPhase: "Stage-First Project Visualization",
    currentPriority: "先判断事情属于待思考、待规划还是待执行。",
    currentMilestone: "需求环节总图与启发式对话入口",
  },
  direction: {
    summary: "把项目总览升级为经营总览首页。",
    nextConversationAction: "先问范围、范围外、取舍、优先级和验收标准。",
    evidenceHref: "/knowledge-base?path=memory/project/roadmap.md",
  },
  homepage: {
    eyebrow: "需求总览",
    headline: "先定问题，再定动作",
    subheadline: "单层 Plan 只在 operating-blueprint 收口。",
    primaryStats: [
      { label: "当前阶段", value: "Single-Plan Demand Operating Model" },
      { label: "当前里程碑", value: "单层 Plan、阶段优先与高 ROI Test 治理" },
      { label: "下一方向", value: "把首页收口成只保留需求总览的入口。" },
    ],
  },
  thinkingItems: [
    {
      id: "thinking-1",
      title: "需求还没说清",
      source: "运营蓝图",
      stage: "thinking",
      summary: "先把问题问对，再决定要不要开工。",
      nextConversationAction: "先问问题是什么。",
      evidenceHref: "/knowledge-base?path=memory/project/operating-blueprint.md",
    },
  ],
  planningItems: [],
  readyItems: [],
  doingItems: [],
  acceptanceItems: [],
  releasedItems: [],
  runtimeFacts: {
    summary: "需求判断和运行判断要一起看。",
    blockedItems: ["当前没有结构性阻塞。"],
    nextCheckpoint: ["完成首页 5 个区块。"],
    runtimeSignals: [
      {
        label: "dev 预览",
        status: "运行中",
        summary: "dev 当前在线，可直接继续验收。",
        href: "/releases#runtime-status",
      },
      {
        label: "production",
        status: "未启动",
        summary: "production 当前未启动；先去发布页确认。",
        href: "/releases#runtime-status",
      },
    ],
    frozenItems: ["不新增数据库"],
    pendingDevSummary: "当前没有待验收 dev。",
    activeReleaseId: "rel-prod",
  },
};

describe("home dashboard", () => {
  it("renders a summary-only demand overview instead of a multi-card timeline", () => {
    render(<HomeDashboard overview={cockpitFixture} />);

    expect(screen.getByRole("heading", { name: "先定问题，再定动作" })).toBeInTheDocument();
    expect(screen.getByText("当前阶段")).toBeInTheDocument();
    expect(screen.getByText("当前里程碑")).toBeInTheDocument();
    expect(screen.getByText("下一方向")).toBeInTheDocument();
    expect(screen.queryByText("当前判断")).not.toBeInTheDocument();
    expect(screen.queryByText("01 现在是什么")).not.toBeInTheDocument();
  });
});
