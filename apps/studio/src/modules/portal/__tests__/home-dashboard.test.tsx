import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeDashboard } from "../components/home-dashboard";
import type { ProjectCockpit } from "../types";

const cockpitFixture: ProjectCockpit = {
  identity: {
    oneLiner: "把仓库升级成适合长期协作的 AI-Native Repo。",
  },
  currentFocus: {
    currentPhase: "首页统一驾驶舱一期",
    currentPriority: "升级首页为人类优先的统一项目驾驶舱。",
    currentMilestone: "首页统一驾驶舱一期",
    successCriteria: ["首页固定为 5 个区块", "摘要全部可下钻"],
  },
  executionStatus: {
    summary: "先收口主线，再进入详情页。",
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
    frozenItems: ["不新增数据库"],
    pendingDevSummary: "当前没有待验收 dev。",
  },
};

describe("home dashboard", () => {
  it("renders the compact decision board", () => {
    render(<HomeDashboard overview={cockpitFixture} />);

    expect(screen.getByRole("heading", { name: "先看现状，再看细节" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "阶段与优先级" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "运行态概览" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "阻塞与下一步" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "需要细节时，去哪里看证据" })).not.toBeInTheDocument();
  });
});
