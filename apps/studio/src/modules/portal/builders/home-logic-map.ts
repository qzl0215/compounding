import type { DemandStage, HomeLogicMapSnapshot, HomeLogicNode, HomeLogicNodeId, HomeLogicNodeState } from "../types";

export type BuildHomeLogicMapInput = {
  name: string;
  oneLiner: string;
  overallSummary: string;
  currentPhase: string;
  currentMilestone: string;
  successCriteria: string[];
  activeStage: DemandStage;
  goals: {
    summary: string;
    badge?: string;
  };
  plan: {
    summary: string;
    badge?: string;
  };
  execution: {
    summary: string;
    badge?: string;
  };
  acceptance: {
    summary: string;
    badge?: string;
  };
  focus: {
    summary: string;
    badge?: string;
  };
  blockers: string[];
  pendingAcceptance: string | null;
  runtimeAlert: string | null;
  healthSummary: string;
  aiEfficiency: {
    totalSavedLabel: string;
    avgSavingsLabel: string;
    alert: string | null;
  };
};

const CHAIN_NODE_IDS: HomeLogicNodeId[] = ["goals", "plan", "execution", "acceptance"];

export function buildHomeLogicMapSnapshot(input: BuildHomeLogicMapInput): HomeLogicMapSnapshot {
  const activeChainNode = mapStageToNode(input.activeStage);
  const activeNodeId = input.activeStage === "released" ? "focus" : activeChainNode;
  const focusTargetId = activeNodeId === "focus" ? "acceptance" : activeNodeId;

  const nodes: HomeLogicNode[] = [
    buildNode("focus", "当前焦点", "/knowledge-base?path=memory/project/current-state.md", input.focus.summary, {
      badge: input.focus.badge,
      state: input.blockers.length > 0 ? "warning" : activeNodeId === "focus" ? "active" : "healthy",
    }),
    buildNode("goals", "目标与里程碑", "/knowledge-base?path=memory/project/roadmap.md", input.goals.summary, {
      badge: input.goals.badge,
      state: resolveChainNodeState("goals", activeNodeId, input.pendingAcceptance, input.runtimeAlert),
    }),
    buildNode("plan", "计划边界", "/knowledge-base?path=memory/project/operating-blueprint.md", input.plan.summary, {
      badge: input.plan.badge,
      state: resolveChainNodeState("plan", activeNodeId, input.pendingAcceptance, input.runtimeAlert),
    }),
    buildNode("execution", "执行事项", "/tasks", input.execution.summary, {
      badge: input.execution.badge,
      state: resolveChainNodeState("execution", activeNodeId, input.pendingAcceptance, input.runtimeAlert),
    }),
    buildNode("acceptance", "验收与运行", "/releases", input.acceptance.summary, {
      badge: input.acceptance.badge,
      state: resolveChainNodeState("acceptance", activeNodeId, input.pendingAcceptance, input.runtimeAlert),
    }),
  ];

  return {
    identity: {
      name: input.name,
      oneLiner: input.oneLiner,
    },
    headline: {
      overallSummary: input.overallSummary,
      currentPhase: input.currentPhase,
      currentMilestone: input.currentMilestone,
    },
    success: {
      criteria: input.successCriteria.slice(0, 3),
    },
    logicMap: {
      nodes,
      edges: [
        { from: "goals", to: "plan" },
        { from: "plan", to: "execution" },
        { from: "execution", to: "acceptance" },
        { from: "focus", to: focusTargetId },
      ],
      activeNodeId,
    },
    attention: {
      blockers: input.blockers,
      pendingAcceptance: input.pendingAcceptance,
      runtimeAlert: input.runtimeAlert,
      healthSummary: input.healthSummary,
    },
    aiEfficiency: input.aiEfficiency,
  };
}

function buildNode(id: HomeLogicNodeId, label: string, href: string, summary: string, options: { badge?: string; state: HomeLogicNodeState }): HomeLogicNode {
  return {
    id,
    label,
    href,
    summary,
    state: options.state,
    badge: options.badge,
  };
}

function resolveChainNodeState(
  nodeId: Exclude<HomeLogicNodeId, "focus">,
  activeNodeId: HomeLogicNodeId,
  pendingAcceptance: string | null,
  runtimeAlert: string | null
): HomeLogicNodeState {
  if (nodeId === "acceptance" && (pendingAcceptance || runtimeAlert)) {
    return "warning";
  }

  if (activeNodeId !== "focus" && nodeId === activeNodeId) {
    return "active";
  }

  const activeIndex = activeNodeId === "focus" ? CHAIN_NODE_IDS.length - 1 : CHAIN_NODE_IDS.indexOf(activeNodeId);
  const nodeIndex = CHAIN_NODE_IDS.indexOf(nodeId);
  if (nodeIndex <= activeIndex) {
    return "complete";
  }

  return "healthy";
}

function mapStageToNode(stage: DemandStage): HomeLogicNodeId {
  if (stage === "thinking" || stage === "planning") {
    return "plan";
  }
  if (stage === "ready" || stage === "doing") {
    return "execution";
  }
  if (stage === "acceptance") {
    return "acceptance";
  }
  return "focus";
}
