import { HomeDashboard } from "@/modules/portal/components/home-dashboard";
import { getProjectOverview } from "@/modules/portal";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const overview = await getProjectOverview();
  return <HomeDashboard overview={overview} />;
}
