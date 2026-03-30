import type { DeliverySnapshot } from "@/modules/delivery";
import type { HarnessLiveSnapshot } from "@/modules/harness";
import type { HomeLogicMapSnapshot } from "@/modules/portal";
import type { ProjectStateSnapshot } from "@/modules/project-state";

export type OrchestrationSnapshot = {
  generatedAt: string;
  harness: HarnessLiveSnapshot;
  delivery: DeliverySnapshot;
  projectState: ProjectStateSnapshot;
  home: HomeLogicMapSnapshot;
};
