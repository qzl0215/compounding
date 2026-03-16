"use client";

import type { PromptDocPreview } from "@/modules/docs/ai-rewrite-types";
import { MarkdownContent } from "./markdown-content";

export function PanelList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-medium text-white">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-7 text-white/72">
          {items.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-white/48">无</p>
      )}
    </div>
  );
}

export function PromptDocPreviews({ promptDocs }: { promptDocs: PromptDocPreview[] }) {
  return (
    <div className="mt-4 space-y-3">
      {promptDocs.map((doc) => (
        <details key={doc.path} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
          <summary className="cursor-pointer list-none text-sm font-medium text-white">{doc.title}</summary>
          <div className="mt-4">
            <MarkdownContent content={doc.content} compact />
          </div>
        </details>
      ))}
    </div>
  );
}
