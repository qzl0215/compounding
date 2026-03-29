import { HarnessBoard, getHarnessLiveSnapshot } from "@/modules/harness";
import { HomeLogicBoard } from "@/modules/portal/components/home-logic-board";
import { getHomeStatusBoard } from "@/modules/portal";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [snapshot, harness] = await Promise.all([getHomeStatusBoard(), getHarnessLiveSnapshot()]);
  return (
    <div className="space-y-6">
      <HarnessBoard snapshot={harness} compact />
      <HomeLogicBoard snapshot={snapshot} />
    </div>
  );
}
