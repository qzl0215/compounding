import type { DocMeta } from "../types";
import { Card } from "@/components/ui/card";
import { extractHeadings, MarkdownContent } from "./markdown-content";

type Props = {
  title: string;
  meta: DocMeta;
  content: string;
  absolutePath: string;
};

export function DocViewer({ title, meta, content, absolutePath }: Props) {
  const headings = extractHeadings(content);
  const displayTitle = meta.title ?? title;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
      <Card className="space-y-6">
        <div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">知识库</p>
            <h2 className="mt-2 text-2xl font-semibold">{displayTitle}</h2>
            <p className="mt-2 font-mono text-xs text-white/35">{absolutePath}</p>
          </div>
        </div>
        <MarkdownContent content={content} />
      </Card>
      <Card className="h-fit">
        <p className="text-xs uppercase tracking-[0.28em] text-accent">页内导航</p>
        <div className="mt-4 space-y-2 text-sm text-white/70">
          {headings.length > 0 ? (
            headings.map((heading) => (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                className="block rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 transition hover:border-accent/30 hover:text-white"
              >
                {heading.label}
              </a>
            ))
          ) : (
            <p>当前文档没有可导航标题。</p>
          )}
        </div>
      </Card>
    </div>
  );
}
