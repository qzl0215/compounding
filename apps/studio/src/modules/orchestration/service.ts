import { getDeliverySnapshot } from "@/modules/delivery";
import { getHomeStatusBoard } from "@/modules/portal";
import { getProjectStateSnapshot } from "@/modules/project-state";
import type { OrchestrationSnapshot } from "./types";

export async function getOrchestrationSnapshot(): Promise<OrchestrationSnapshot> {
  const delivery = await getDeliverySnapshot();
  const projectState = await getProjectStateSnapshot({ deliverySnapshot: delivery });
  const home = await getHomeStatusBoard({ projectState });

  return {
    generatedAt: new Date().toISOString(),
    harness: delivery.facts.harness,
    delivery,
    projectState,
    home,
  };
}
