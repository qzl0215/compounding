"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/classnames";
import { renderDocContent, type DocKind } from "@/modules/docs/content";
import { extractFirstHeading } from "@/modules/docs/sections";
import type { DocMeta } from "@/modules/docs/types";
import { MarkdownContent } from "./markdown-content";

type Props = {
  title: string;
  path: string;
  meta: DocMeta;
  content: string;
  rawContent: string;
  kind: DocKind;
  editable: boolean;
  hasManagedBlocks: boolean;
};

type SaveResponse = {
  ok: boolean;
  message?: string;
  doc?: {
    content: string;
    rawContent: string;
    kind: DocKind;
    editable: boolean;
    hasManagedBlocks: boolean;
  };
};

export function DocViewer({
  title,
  path,
  meta,
  content,
  rawContent,
  kind,
  editable,
  hasManagedBlocks,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(rawContent);
  const [savedRaw, setSavedRaw] = useState(rawContent);
  const [savedContent, setSavedContent] = useState(content);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsEditing(false);
    setDraft(rawContent);
    setSavedRaw(rawContent);
    setSavedContent(content);
    setStatusMessage(null);
    setErrorMessage(null);
    setIsSaving(false);
  }, [path, rawContent, content]);

  const previewContent = useMemo(() => renderDocContent(draft, kind), [draft, kind]);
  const displayTitle = extractFirstHeading(isEditing ? previewContent : savedContent) ?? meta.title ?? title;

  async function handleSave() {
    if (!editable || kind !== "markdown") {
      return;
    }

    setStatusMessage(null);
    setErrorMessage(null);
    setIsSaving(true);
    try {
      const response = await fetch("/api/docs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path, rawContent: draft }),
      });
      const payload = (await response.json().catch(() => ({}))) as SaveResponse;
      if (!response.ok || !payload.ok || !payload.doc) {
        throw new Error(payload.message || "保存失败。");
      }
      setSavedRaw(payload.doc.rawContent);
      setSavedContent(payload.doc.content);
      setDraft(payload.doc.rawContent);
      setIsEditing(false);
      setStatusMessage("保存成功。");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "保存失败。");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setDraft(savedRaw);
    setIsEditing(false);
    setStatusMessage(null);
    setErrorMessage(null);
  }

  return (
    <Card className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div>
            <h2 className="text-2xl font-semibold">{displayTitle}</h2>
            <p className="mt-2 text-sm text-white/48">{path}</p>
          </div>
          {editable && hasManagedBlocks ? (
            <p className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100/88">
              当前文档包含 scaffold 托管区块。你可以直接全文编辑，但后续运行 scaffold 时托管区块可能被覆盖。
            </p>
          ) : null}
          {statusMessage ? <p className="text-sm text-emerald-300">{statusMessage}</p> : null}
          {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}
        </div>
        {editable ? (
          <div className="flex flex-wrap items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                className="rounded-full border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-accent transition hover:bg-accent/18"
                onClick={() => setIsEditing(true)}
              >
                编辑
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded-full border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-accent transition hover:bg-accent/18 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "保存中..." : "保存"}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/72 transition hover:border-white/20 hover:text-white"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  取消
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-white/42">Markdown 源文</p>
            <textarea
              className={cn(
                "min-h-[70vh] w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4 font-mono text-sm leading-7 text-white outline-none transition",
                "focus:border-accent/35 focus:ring-2 focus:ring-accent/20"
              )}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              spellCheck={false}
            />
          </section>
          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-white/42">实时预览</p>
            <div className="min-h-[70vh] rounded-[1.5rem] border border-white/8 bg-black/10 px-5 py-5">
              <MarkdownContent content={previewContent} />
            </div>
          </section>
        </div>
      ) : (
        <MarkdownContent content={savedContent} />
      )}
    </Card>
  );
}
