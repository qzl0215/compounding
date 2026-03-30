import { HarnessBoard } from "@/modules/harness";
import { getOrchestrationSnapshot } from "@/modules/orchestration";
import { HomeLogicBoard } from "@/modules/portal/components/home-logic-board";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getOrchestrationSnapshot();

  return (
    <div className="space-y-6">
      <HarnessBoard snapshot={snapshot.harness} compact />
      <HomeLogicBoard snapshot={snapshot.home} />
    </div>
  );
}
