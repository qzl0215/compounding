import { HomeDashboard } from "@/modules/portal/components/home-dashboard";
import { getProjectCockpit } from "@/modules/portal";

export default async function HomePage() {
  const overview = await getProjectCockpit();
  return <HomeDashboard overview={overview} />;
}
