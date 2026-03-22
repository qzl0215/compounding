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
    headline: "先扩选项，再收决策",
    subheadline: "单层 Plan 只在 operating-blueprint 收口。",
    primaryStats: [
      { label: "当前阶段", value: "Single-Plan Demand Operating Model" },
      { label: "当前里程碑", value: "单层 Plan、阶段优先与高 ROI Test 治理" },
      { label: "当前优先级", value: "先明确事情属于待思考、待规划还是待执行。" },
      { label: "下一方向", value: "把首页收口成只保留需求总览的入口。" },
    ],
    stageStats: [
      { label: "待思考", value: "1", hint: "先补问题" },
      { label: "待规划", value: "0", hint: "先收边界" },
      { label: "待执行", value: "0", hint: "可进 task" },
      { label: "执行中", value: "0", hint: "看推进" },
      { label: "待验收", value: "0", hint: "先判断" },
    ],
    decision: {
      title: "当前先扩选项",
      summary: "像“需求还没说清”这类事项还在待思考。先补问题、价值和时机。",
      evidenceHref: "/knowledge-base?path=memory/project/operating-blueprint.md",
      ctaLabel: "回主源补问题",
      badge: "1 条待思考",
    },
    routes: [
      { href: "/knowledge-base", label: "证据库", description: "看主源、规则和背景。", scope: "memory" },
      { href: "/tasks", label: "执行面板", description: "看真正可推进的事项。", scope: "tasks" },
      { href: "/releases", label: "发布事实", description: "看验收、版本和运行态。", scope: "release" },
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

    expect(screen.getByRole("heading", { name: "先扩选项，再收决策" })).toBeInTheDocument();
    expect(screen.getByText("当前阶段")).toBeInTheDocument();
    expect(screen.getByText("当前里程碑")).toBeInTheDocument();
    expect(screen.getByText("当前判断")).toBeInTheDocument();
    expect(screen.queryByText("01 现在是什么")).not.toBeInTheDocument();
  });
});
