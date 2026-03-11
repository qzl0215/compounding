import { BootstrapEditor } from "@/components/bootstrap/bootstrap-editor";
import { readProjectBrief, readProjectBriefSchema } from "@/lib/config";

export default async function InitializePage() {
  const [initialBrief, schema] = await Promise.all([readProjectBrief(), readProjectBriefSchema()]);
  return <BootstrapEditor initialBrief={initialBrief} schema={schema} />;
}
