"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { mergeEditableMarkdown, renderDocContent, type DocKind } from "@/modules/docs/content";
import { extractFirstHeading } from "@/modules/docs/sections";
import type { DocMeta, PromptHistoryEntry } from "@/modules/docs/types";
import type { PromptDocPreview } from "@/modules/docs/ai-rewrite-types";
import { AiRewritePanel } from "./ai-rewrite-panel";
import { DocViewerToolbar } from "./doc-viewer-toolbar";
import type { PromptHistoryResponse, SaveResponse, ViewMode } from "./doc-viewer-types";
import { MarkdownContent } from "./markdown-content";
import { RichDocEditor } from "./rich-doc-editor";
type Props = {
  title: string;
  path: string;
  meta: DocMeta;
  content: string;
  rawContent: string;
  kind: DocKind;
  editable: boolean;
  hasManagedBlocks: boolean;
  promptDocs: PromptDocPreview[];
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
  promptDocs,
}: Props) {
  const [mode, setMode] = useState<ViewMode>("read");
  const [bodyDraft, setBodyDraft] = useState(content);
  const [rawDraft, setRawDraft] = useState(rawContent);
  const [savedRaw, setSavedRaw] = useState(rawContent);
  const [savedContent, setSavedContent] = useState(content);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [promptHistory, setPromptHistory] = useState<PromptHistoryEntry[]>([]);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const isPromptDoc = path.startsWith("docs/prompts/");
  useEffect(() => {
    setMode("read");
    setBodyDraft(content);
    setRawDraft(rawContent);
    setSavedRaw(rawContent);
    setSavedContent(content);
    setStatusMessage(null);
    setErrorMessage(null);
    setIsSaving(false);
    setIsAiOpen(false);
  }, [path, rawContent, content]);

  useEffect(() => {
    if (!editable || !isPromptDoc) {
      setPromptHistory([]);
      return;
    }
    fetch(`/api/docs/prompt-history?path=${encodeURIComponent(path)}`)
      .then((response) => response.json())
      .then((payload: PromptHistoryResponse) => {
        if (payload.ok && payload.history) {
          setPromptHistory(payload.history);
        }
      })
      .catch(() => setPromptHistory([]));
  }, [editable, isPromptDoc, path]);

  const previewContent = useMemo(() => renderDocContent(rawDraft, kind), [rawDraft, kind]);
  const displayTitle =
    extractFirstHeading(mode === "advanced" ? previewContent : mode === "edit" ? bodyDraft : savedContent) ?? meta.title ?? title;

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          content: mode === "advanced" ? rawDraft : bodyDraft,
          mode: mode === "advanced" ? "raw" : "body",
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as SaveResponse;
      if (!response.ok || !payload.ok || !payload.doc) {
        throw new Error(payload.message || "保存失败。");
      }
      setSavedRaw(payload.doc.rawContent);
      setSavedContent(payload.doc.content);
      setRawDraft(payload.doc.rawContent);
      setBodyDraft(payload.doc.content);
      setMode("read");
      setStatusMessage("保存成功。");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "保存失败。");
    } finally {
      setIsSaving(false);
    }
  }

  function enterEditMode() {
    setBodyDraft(savedContent);
    setMode("edit");
    setStatusMessage(null);
    setErrorMessage(null);
  }

  function enterAdvancedMode() {
    const nextRaw = mode === "edit" ? mergeEditableMarkdown(savedRaw, bodyDraft, kind) : rawDraft;
    setRawDraft(nextRaw);
    setMode("advanced");
    setStatusMessage(null);
    setErrorMessage(null);
  }

  function returnToRichEditor() {
    setBodyDraft(renderDocContent(rawDraft, kind));
    setMode("edit");
  }

  function handleCancel() {
    setBodyDraft(savedContent);
    setRawDraft(savedRaw);
    setMode("read");
    setStatusMessage(null);
    setErrorMessage(null);
  }

  async function handlePromptRollback() {
    if (!isPromptDoc || promptHistory.length === 0) {
      return;
    }
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/docs/prompt-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, versionId: promptHistory[0].versionId }),
      });
      const payload = (await response.json().catch(() => ({}))) as PromptHistoryResponse;
      if (!response.ok || !payload.ok || !payload.doc) {
        throw new Error(payload.message || "回退失败。");
      }
      setSavedRaw(payload.doc.rawContent);
      setSavedContent(payload.doc.content);
      setRawDraft(payload.doc.rawContent);
      setBodyDraft(payload.doc.content);
      setMode("read");
      setStatusMessage("已回退到上一版本。");
      setPromptHistory((current) => current.slice(1));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "回退失败。");
    }
  }

  return (
    <>
      <Card className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div>
              <h2 className="text-2xl font-semibold">{displayTitle}</h2>
              <p className="mt-2 text-sm text-white/48">{path}</p>
            </div>
            {editable && hasManagedBlocks && mode !== "advanced" ? (
              <p className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100/88">
                当前文档包含 scaffold 托管区块。你正在编辑正文层；如需修改 frontmatter 或托管标记，请切换到高级模式。
              </p>
            ) : null}
            {editable && mode === "advanced" && hasManagedBlocks ? (
              <p className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100/88">
                当前是高级模式。你正在编辑完整 Markdown；后续运行 scaffold 时，托管区块仍可能被覆盖。
              </p>
            ) : null}
            {statusMessage ? <p className="text-sm text-emerald-300">{statusMessage}</p> : null}
            {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}
          </div>
          <DocViewerToolbar
            editable={editable}
            mode={mode}
            isSaving={isSaving}
            isPromptDoc={isPromptDoc}
            promptHistoryCount={promptHistory.length}
            onEdit={enterEditMode}
            onOpenAi={() => setIsAiOpen(true)}
            onRollback={handlePromptRollback}
            onSave={handleSave}
            onCancel={handleCancel}
            onAdvanced={enterAdvancedMode}
            onReturnToRich={returnToRichEditor}
          />
        </div>

        {mode === "read" ? (
          <MarkdownContent content={savedContent} />
        ) : mode === "edit" ? (
          <RichDocEditor markdown={bodyDraft} onChange={setBodyDraft} />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section className="space-y-3">
              <p className="text-xs uppercase tracking-[0.22em] text-white/42">完整 Markdown 原文</p>
              <textarea
                className="min-h-[70vh] w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4 font-mono text-sm leading-7 text-white outline-none transition focus:border-accent/35 focus:ring-2 focus:ring-accent/20"
                value={rawDraft}
                onChange={(event) => setRawDraft(event.target.value)}
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
        )}
      </Card>

      <AiRewritePanel
        open={isAiOpen}
        path={path}
        content={mode === "edit" ? bodyDraft : savedContent}
        promptDocs={promptDocs}
        onClose={() => setIsAiOpen(false)}
        onApply={(value) => {
          setBodyDraft(value);
          setMode("edit");
          setIsAiOpen(false);
          setStatusMessage("AI 重构结果已应用到正文草稿，尚未保存。");
          setErrorMessage(null);
        }}
      />
    </>
  );
}
