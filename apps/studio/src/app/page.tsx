import { HomeDashboard } from "@/modules/portal/components/home-dashboard";
import { getPortalOverview } from "@/modules/portal";

export default async function HomePage() {
  const overview = await getPortalOverview();
  return <HomeDashboard overview={overview} />;
}
