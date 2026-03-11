import { redirect } from "next/navigation";

export default async function RewriteProposalsPage() {
  redirect("/reviews");
}
