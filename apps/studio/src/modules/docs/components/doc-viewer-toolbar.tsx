"use client";

import type { ViewMode } from "./doc-viewer-types";

type Props = {
  editable: boolean;
  mode: ViewMode;
  isSaving: boolean;
  isPromptDoc: boolean;
  promptHistoryCount: number;
  onEdit: () => void;
  onOpenAi: () => void;
  onRollback: () => void;
  onSave: () => void;
  onCancel: () => void;
  onAdvanced: () => void;
  onReturnToRich: () => void;
};

export function DocViewerToolbar({
  editable,
  mode,
  isSaving,
  isPromptDoc,
  promptHistoryCount,
  onEdit,
  onOpenAi,
  onRollback,
  onSave,
  onCancel,
  onAdvanced,
  onReturnToRich,
}: Props) {
  if (!editable) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {mode === "read" ? (
        <>
          <button
            type="button"
            className="rounded-full border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-accent transition hover:bg-accent/18"
            onClick={onEdit}
          >
            编辑
          </button>
          <button
            type="button"
            className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/72 transition hover:border-white/20 hover:text-white"
            onClick={onOpenAi}
          >
            AI 重构
          </button>
          {isPromptDoc && promptHistoryCount > 0 ? (
            <button
              type="button"
              className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/72 transition hover:border-white/20 hover:text-white"
              onClick={onRollback}
            >
              回退到上一版本
            </button>
          ) : null}
        </>
      ) : (
        <>
          <button
            type="button"
            className="rounded-full border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-accent transition hover:bg-accent/18 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? "保存中..." : "保存"}
          </button>
          <button
            type="button"
            className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/72 transition hover:border-white/20 hover:text-white"
            onClick={onCancel}
            disabled={isSaving}
          >
            取消
          </button>
          {mode === "edit" ? (
            <>
              <button
                type="button"
                className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/72 transition hover:border-white/20 hover:text-white"
                onClick={onAdvanced}
              >
                高级模式
              </button>
              <button
                type="button"
                className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/72 transition hover:border-white/20 hover:text-white"
                onClick={onOpenAi}
              >
                AI 重构
              </button>
            </>
          ) : (
            <button
              type="button"
              className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/72 transition hover:border-white/20 hover:text-white"
              onClick={onReturnToRich}
            >
              返回正文编辑
            </button>
          )}
        </>
      )}
    </div>
  );
}
