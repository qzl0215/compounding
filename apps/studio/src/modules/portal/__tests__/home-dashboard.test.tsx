import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeDashboard } from "../components/home-dashboard";
import type { ProjectCockpit } from "../types";

const cockpitFixture: ProjectCockpit = {
  identity: {
    oneLiner: "把仓库升级成适合长期协作的 AI-Native Repo。",
    mission: "让人和 AI 更快对齐项目信息。",
    successDefinition: "不会代码的负责人也能看懂当前主线。",
    mustProtect: ["AGENTS.md 是唯一主源", "不新增平行真相源"],
  },
  currentFocus: {
    currentPhase: "首页统一驾驶舱一期",
    currentPriority: "升级首页为人类优先的统一项目驾驶舱。",
    currentMilestone: "首页统一驾驶舱一期",
    successCriteria: ["首页固定为 5 个区块", "摘要全部可下钻"],
  },
  executionStatus: {
    headline: "首页统一驾驶舱一期",
    summary: "先收口主线，再进入详情页。",
    doingTasks: [
      {
        title: "任务 task-018-home-unified-cockpit",
        goal: "把首页升级为统一驾驶舱。",
        status: "进行中",
        path: "tasks/queue/task-018-home-unified-cockpit.md",
        relatedModules: ["apps/studio/src/modules/portal"],
        updateTrace: "memory/project/roadmap.md / AGENTS.md",
      },
    ],
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
  },
  riskBoard: {
    factConflicts: [],
    frozenItems: ["不新增数据库"],
    items: [
      {
        title: "待验收版本",
        summary: "当前存在待验收 dev。",
        tone: "warning",
        href: "/releases",
      },
    ],
  },
  evidenceLinks: [
    {
      title: "主源文档",
      items: [{ title: "AGENTS", summary: "执行入口。", href: "/knowledge-base?path=AGENTS.md" }],
    },
    {
      title: "详情工作台",
      items: [{ title: "任务详情", summary: "查看 task 原文。", href: "/tasks" }],
    },
    {
      title: "辅助理解",
      items: [{ title: "工作模式", summary: "查看业务链。", href: "/knowledge-base?path=docs/WORK_MODES.md" }],
    },
  ],
};

describe("home dashboard", () => {
  it("renders the five fixed cockpit sections", () => {
    render(<HomeDashboard overview={cockpitFixture} />);

    expect(screen.getByRole("heading", { name: "项目是什么" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "当前优先级与里程碑" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "当前主线在怎么推进" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "先看哪里可能失真或卡住" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "需要细节时，去哪里看证据" })).toBeInTheDocument();
  });
});
