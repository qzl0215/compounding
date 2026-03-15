import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DocMeta } from "../types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  title: string;
  meta: DocMeta;
  content: string;
  absolutePath: string;
};

export function DocViewer({ title, meta, content, absolutePath }: Props) {
  const headings = extractHeadings(content);
  const displayTitle = meta.title ?? title;
  const relatedDocs = meta.related_docs ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
      <Card className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">知识库</p>
            <h2 className="mt-2 text-2xl font-semibold">{displayTitle}</h2>
            <p className="mt-2 font-mono text-xs text-white/45">{absolutePath}</p>
          </div>
          <Badge tone="accent">{meta.status ?? "active"}</Badge>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <Meta title="文档角色" value={formatDocRole(meta.doc_role ?? "source")} />
          <Meta title="更新方式" value={formatUpdateMode(meta.update_mode ?? "manual")} />
          <Meta title="责任角色" value={meta.owner_role ?? "Canonical Source"} />
          <Meta title="最后审阅" value={meta.last_reviewed_at ?? "manual"} />
          <Meta title="真相来源" value={meta.source_of_truth ?? "self"} />
          <Meta title="状态" value={formatStatus(meta.status ?? "active")} />
        </div>
        <div className="prose prose-invert max-w-none prose-headings:font-semibold prose-hr:border-white/10 prose-p:text-white/78 prose-strong:text-white prose-code:text-accent prose-pre:border prose-pre:border-white/8 prose-pre:bg-black/35 prose-table:block prose-table:w-full prose-table:overflow-x-auto prose-th:border prose-th:border-white/12 prose-th:bg-white/[0.04] prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-white/10 prose-td:px-3 prose-td:py-2">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => renderHeading("h1", children),
              h2: ({ children }) => renderHeading("h2", children),
              h3: ({ children }) => renderHeading("h3", children)
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-sm font-medium text-white">相关文档</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedDocs.map((doc) => (
              <Badge key={doc}>{doc}</Badge>
            ))}
          </div>
        </div>
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

function Meta({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/42">{title}</p>
      <p className="mt-2 text-sm text-white/78">{value}</p>
    </div>
  );
}

function renderHeading(tag: "h1" | "h2" | "h3", children: ReactNode) {
  const text = flattenText(children);
  const id = slugify(text);
  const Heading = tag;
  return (
    <Heading id={id} className="scroll-mt-24">
      {children}
    </Heading>
  );
}

function flattenText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(flattenText).join("");
  }
  if (node && typeof node === "object" && "props" in node) {
    return flattenText((node as { props?: { children?: ReactNode } }).props?.children ?? "");
  }
  return "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
    .replace(/\s+/g, "-");
}

function extractHeadings(content: string) {
  return content
    .split("\n")
    .filter((line) => /^#{1,3}\s+/.test(line))
    .map((line) => {
      const label = line.replace(/^#{1,3}\s+/, "").trim();
      return { label, id: slugify(label) };
    });
}

function formatDocRole(value: string) {
  const labels: Record<string, string> = {
    source: "主源",
    reference: "参考",
    operation: "操作",
    memory: "记忆",
    planning: "规划",
    archive: "归档"
  };
  return labels[value] ?? value;
}

function formatUpdateMode(value: string) {
  const labels: Record<string, string> = {
    manual: "手动维护",
    promote_only: "仅升格写入",
    append_only: "仅追加",
    generated: "自动生成"
  };
  return labels[value] ?? value;
}

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    active: "启用中",
    draft: "草稿",
    archived: "已归档"
  };
  return labels[value] ?? value;
}
