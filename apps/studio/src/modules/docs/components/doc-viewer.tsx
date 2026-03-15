import type { DocMeta } from "../types";
import { Card } from "@/components/ui/card";
import { MarkdownContent } from "./markdown-content";
import { extractFirstHeading } from "../sections";

type Props = {
  title: string;
  meta: DocMeta;
  content: string;
};

export function DocViewer({ title, meta, content }: Props) {
  const displayTitle = extractFirstHeading(content) ?? meta.title ?? title;

  return (
    <Card className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{displayTitle}</h2>
      </div>
      <MarkdownContent content={content} />
    </Card>
  );
}
