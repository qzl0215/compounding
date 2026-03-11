import { redirect } from "next/navigation";

export default function SopTemplatesPage() {
  redirect("/knowledge-base?path=PLAYBOOK.md");
}
