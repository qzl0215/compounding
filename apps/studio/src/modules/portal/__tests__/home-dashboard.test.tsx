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
    summary: "把项目总览升级为需求环节总图。",
    nextConversationAction: "先问范围、范围外、取舍、优先级和验收标准。",
    evidenceHref: "/knowledge-base?path=memory/project/roadmap.md",
  },
  homepage: {
    eyebrow: "需求总览",
    headline: "先定阶段，再定动作",
    subheadline: "先判断是待思考、待规划、待执行还是待验收，再决定讨论、建 task 或发布。",
    primaryStats: [
      { label: "当前阶段", value: "Stage-First Project Visualization" },
      { label: "当前里程碑", value: "需求环节总图与启发式对话入口" },
      { label: "下一方向", value: "把项目总览升级为需求环节总图。" },
    ],
    stageStats: [
      { label: "待思考", value: "1" },
      { label: "待规划", value: "0" },
      { label: "待执行", value: "0" },
      { label: "执行中", value: "0" },
      { label: "待验收", value: "0" },
    ],
    sectionHints: {
      thinking: "先定义问题，不开工",
      planning: "先收口边界，再定方案",
      execution: "只展示真正可执行的事项",
      acceptance: "先完成验收，再继续推进",
    },
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
  it("renders the stage-first overview", () => {
    render(<HomeDashboard overview={cockpitFixture} />);

    expect(screen.getByRole("heading", { name: "先定阶段，再定动作" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "先定义问题，不开工" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "先收口边界，再定方案" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "只展示真正可执行的事项" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "先完成验收，再继续推进" })).toBeInTheDocument();
    expect(screen.queryByText("AI 下一步")).not.toBeInTheDocument();
  });
});
