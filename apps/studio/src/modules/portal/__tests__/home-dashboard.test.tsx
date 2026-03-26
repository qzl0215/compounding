import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeLogicBoard } from "../components/home-logic-board";
import type { HomeLogicMapSnapshot } from "../types";

const snapshotFixture: HomeLogicMapSnapshot = {
  identity: {
    name: "Compounding",
    oneLiner: "把首页重构为人类可扫读的项目逻辑态势图。",
  },
  headline: {
    overallSummary: "当前重点是把首页改成逻辑结构图，让人一眼看懂目标、节奏和风险。",
    currentPhase: "Structural Entropy Reduction",
    currentMilestone: "首页逻辑态势图",
  },
  success: {
    criteria: ["首页首屏不滚动即可回答项目目标", "每个逻辑节点都能打开对应文档或页面"],
  },
  logicMap: {
    activeNodeId: "execution",
    edges: [
      { from: "goals", to: "plan" },
      { from: "plan", to: "execution" },
      { from: "execution", to: "acceptance" },
      { from: "focus", to: "execution" },
    ],
    nodes: [
      {
        id: "focus",
        label: "当前焦点",
        href: "/knowledge-base?path=memory/project/current-state.md",
        summary: "先把首页改成人类友好的逻辑结构图。",
        state: "healthy",
        badge: "现在",
      },
      {
        id: "goals",
        label: "目标与里程碑",
        href: "/knowledge-base?path=memory/project/roadmap.md",
        summary: "当前优先级：首页逻辑态势图；成功标准：节点可点击。",
        state: "complete",
        badge: "Structural Entropy Reduction",
      },
      {
        id: "plan",
        label: "计划边界",
        href: "/knowledge-base?path=memory/project/operating-blueprint.md",
        summary: "待规划 2 项，待思考 1 项。",
        state: "complete",
        badge: "待规划 2",
      },
      {
        id: "execution",
        label: "执行事项",
        href: "/tasks",
        summary: "进行中 1 项。当前主线：t-064 首页逻辑态势图。",
        state: "active",
        badge: "进行中 1",
      },
      {
        id: "acceptance",
        label: "验收与运行",
        href: "/releases",
        summary: "当前无待验收版本。",
        state: "healthy",
        badge: "稳定",
      },
    ],
  },
  attention: {
    blockers: [],
    pendingAcceptance: null,
    runtimeAlert: null,
    healthSummary: "当前无待验收版本，运行正常，可继续按当前焦点推进。",
  },
  aiEfficiency: {
    totalSavedLabel: "~54.8K",
    avgSavingsLabel: "97.97%",
    alert: null,
  },
};

describe("home logic board", () => {
  it("renders a single human-friendly logic board without kernel/project tabs", () => {
    render(<HomeLogicBoard snapshot={snapshotFixture} />);

    expect(screen.getByRole("heading", { name: "Compounding" })).toBeInTheDocument();
    expect(screen.getByText("项目态势图")).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.queryByText("Kernel / Project")).not.toBeInTheDocument();
    expect(screen.queryByText("attach / audit / proposal")).not.toBeInTheDocument();
  });

  it("renders clickable logic nodes and drilldown entries", () => {
    render(<HomeLogicBoard snapshot={snapshotFixture} />);

    expect(screen.getByRole("link", { name: "目标与里程碑" })).toHaveAttribute(
      "href",
      "/knowledge-base?path=memory/project/roadmap.md",
    );
    expect(screen.getByRole("link", { name: "计划边界" })).toHaveAttribute(
      "href",
      "/knowledge-base?path=memory/project/operating-blueprint.md",
    );
    expect(screen.getByRole("link", { name: "执行事项" })).toHaveAttribute("href", "/tasks");
    expect(screen.getByRole("link", { name: "验收与运行" })).toHaveAttribute("href", "/releases");
    expect(screen.getByRole("link", { name: "当前焦点" })).toHaveAttribute(
      "href",
      "/knowledge-base?path=memory/project/current-state.md",
    );
    expect(screen.getByRole("link", { name: /证据库/ })).toHaveAttribute("href", "/knowledge-base");
  });

  it("surfaces a light health summary when there are no alerts", () => {
    render(<HomeLogicBoard snapshot={snapshotFixture} />);

    expect(screen.getByText("健康结论")).toBeInTheDocument();
    expect(screen.getByText("当前无待验收版本，运行正常，可继续按当前焦点推进。")).toBeInTheDocument();
  });

  it("surfaces the shared default summary-first workflow", () => {
    render(<HomeLogicBoard snapshot={snapshotFixture} />);

    expect(screen.getByText("默认摘要链")).toBeInTheDocument();
    expect(screen.getByText(/原始回退链/)).toBeInTheDocument();
    expect(screen.getByText("pnpm ai:preflight:summary")).toBeInTheDocument();
    expect(screen.getByText(/pnpm preflight/)).toBeInTheDocument();
  });
});
