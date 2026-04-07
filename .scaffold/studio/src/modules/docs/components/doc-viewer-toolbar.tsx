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
            className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700 transition hover:bg-sky-100"
            onClick={onEdit}
          >
            编辑
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-sky-200 hover:text-slate-900"
            onClick={onOpenAi}
          >
            AI 重构
          </button>
          {isPromptDoc && promptHistoryCount > 0 ? (
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-sky-200 hover:text-slate-900"
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
            className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? "保存中..." : "保存"}
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-sky-200 hover:text-slate-900"
            onClick={onCancel}
            disabled={isSaving}
          >
            取消
          </button>
          {mode === "edit" ? (
            <>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-sky-200 hover:text-slate-900"
                onClick={onAdvanced}
              >
                高级模式
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-sky-200 hover:text-slate-900"
                onClick={onOpenAi}
              >
                AI 重构
              </button>
            </>
          ) : (
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-sky-200 hover:text-slate-900"
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
