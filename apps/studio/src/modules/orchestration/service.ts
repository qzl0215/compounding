import { getDeliverySnapshot } from "@/modules/delivery";
import { getHomeStatusBoard } from "@/modules/portal";
import { getProjectStateSnapshot } from "@/modules/project-state";
import type { OrchestrationSnapshot } from "./types";

export async function getOrchestrationSnapshot(): Promise<OrchestrationSnapshot> {
  const delivery = await getDeliverySnapshot();
  const projectState = await getProjectStateSnapshot({ deliverySnapshot: delivery });
  const home = await getHomeStatusBoard({ projectState });
  const controlPlane = {
    intent: delivery.facts.harness.active_intent,
    contract: delivery.facts.harness.active_contract,
    state: delivery.facts.harness.state,
    nextAction: delivery.facts.harness.next_action,
    currentExecutor: delivery.facts.harness.current_executor,
    compatibility: delivery.facts.harness.compatibility,
  };

  return {
    generatedAt: new Date().toISOString(),
    controlPlane,
    harness: delivery.facts.harness,
    delivery,
    projectState,
    home,
  };
}
