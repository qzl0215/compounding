import type { ComponentPropsWithoutRef, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/classnames";

type Props = {
  content: string;
  compact?: boolean;
  className?: string;
};

export function MarkdownContent({ content, compact = false, className }: Props) {
  return (
    <div className={cn("markdown-shell", compact && "markdown-compact", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

function renderHeading(tag: "h1" | "h2" | "h3", children: ReactNode) {
  const text = flattenText(children);
  const id = slugify(text);
  const Heading = tag;
  return (
    <Heading id={id} className="group scroll-mt-24">
      <a href={`#${id}`} className="heading-anchor">
        <span>{children}</span>
        <span aria-hidden className="anchor-mark">
          #
        </span>
      </a>
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

const MARKDOWN_COMPONENTS = {
  h1: ({ children }: ComponentPropsWithoutRef<"h1">) => renderHeading("h1", children),
  h2: ({ children }: ComponentPropsWithoutRef<"h2">) => renderHeading("h2", children),
  h3: ({ children }: ComponentPropsWithoutRef<"h3">) => renderHeading("h3", children),
  a: ({ href, children, ...props }: ComponentPropsWithoutRef<"a">) => (
    <a href={href} {...props} className="markdown-link">
      {children}
    </a>
  ),
  blockquote: ({ children }: ComponentPropsWithoutRef<"blockquote">) => <blockquote className="markdown-callout">{children}</blockquote>,
  pre: ({ children }: ComponentPropsWithoutRef<"pre">) => <pre className="markdown-pre">{children}</pre>,
  code: ({ className, children, ...props }: ComponentPropsWithoutRef<"code">) => {
    const value = String(children ?? "");
    const isBlock = value.includes("\n") || Boolean(className);
    return (
      <code {...props} className={cn(isBlock ? "markdown-code-block" : "markdown-inline-code", className)}>
        {children}
      </code>
    );
  },
  table: ({ children }: ComponentPropsWithoutRef<"table">) => (
    <div className="markdown-table-shell">
      <table className="markdown-table">{children}</table>
    </div>
  ),
  th: ({ children }: ComponentPropsWithoutRef<"th">) => <th className="markdown-th">{children}</th>,
  td: ({ children }: ComponentPropsWithoutRef<"td">) => <td className="markdown-td">{children}</td>,
  hr: () => <hr className="markdown-hr" />
};
