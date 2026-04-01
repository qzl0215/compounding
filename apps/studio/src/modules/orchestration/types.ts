import type { DeliverySnapshot } from "@/modules/delivery";
import type { HarnessLiveSnapshot } from "@/modules/harness";
import type { HomeLogicMapSnapshot } from "@/modules/portal";
import type { ProjectStateSnapshot } from "@/modules/project-state";

export type OrchestrationControlPlane = {
  intent: HarnessLiveSnapshot["active_intent"];
  contract: HarnessLiveSnapshot["active_contract"];
  state: HarnessLiveSnapshot["state"];
  nextAction: HarnessLiveSnapshot["next_action"];
  currentExecutor: HarnessLiveSnapshot["current_executor"];
  compatibility: HarnessLiveSnapshot["compatibility"];
};

export type OrchestrationSnapshot = {
  generatedAt: string;
  controlPlane: OrchestrationControlPlane;
  harness: HarnessLiveSnapshot;
  delivery: DeliverySnapshot;
  projectState: ProjectStateSnapshot;
  home: HomeLogicMapSnapshot;
};
