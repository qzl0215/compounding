import ReactMarkdown from "react-markdown";
import type { DocMeta } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  title: string;
  meta: DocMeta;
  content: string;
  absolutePath: string;
};

export function DocViewer({ title, meta, content, absolutePath }: Props) {
  return (
    <Card className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Knowledge Base</p>
          <h2 className="mt-2 text-2xl font-semibold">{meta.title ?? title}</h2>
          <p className="mt-2 font-mono text-xs text-white/45">{absolutePath}</p>
        </div>
        <Badge tone="accent">{meta.status}</Badge>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <Meta title="Owner" value={meta.owner_role} />
        <Meta title="Last Reviewed" value={meta.last_reviewed_at} />
        <Meta title="Source of Truth" value={meta.source_of_truth} />
      </div>
      <div className="prose prose-invert max-w-none prose-headings:font-semibold prose-hr:border-white/10 prose-p:text-white/78 prose-strong:text-white">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
      <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-4">
        <p className="text-sm font-medium text-white">Related Docs</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {meta.related_docs?.map((doc) => (
            <Badge key={doc}>{doc}</Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}

function Meta({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/42">{title}</p>
      <p className="mt-2 text-sm text-white/78">{value}</p>
    </div>
  );
}
