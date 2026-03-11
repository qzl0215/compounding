import { redirect } from "next/navigation";

export default async function BootstrapWizardPage() {
  redirect("/initialize");
}
