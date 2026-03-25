import { HomeLogicBoard } from "@/modules/portal/components/home-logic-board";
import { getHomeStatusBoard } from "@/modules/portal";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getHomeStatusBoard();
  return <HomeLogicBoard snapshot={snapshot} />;
}
