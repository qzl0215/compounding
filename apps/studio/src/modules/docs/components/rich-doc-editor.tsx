"use client";

import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/classnames";
import { parseEditableMarkdown, stringifyEditableMarkdown, type EditableBlock } from "@/modules/docs/editor-model";

type Props = {
  markdown: string;
  onChange: (next: string) => void;
};

export function RichDocEditor({ markdown, onChange }: Props) {
  const blocks = useMemo(() => parseEditableMarkdown(markdown), [markdown]);

  function commit(nextBlocks: EditableBlock[]) {
    onChange(stringifyEditableMarkdown(nextBlocks));
  }

  function updateBlock(index: number, nextBlock: EditableBlock) {
    const next = blocks.map((block, current) => (current === index ? nextBlock : block));
    commit(next);
  }

  function appendParagraph() {
    commit([...blocks, { id: `block-${blocks.length + 1}`, type: "paragraph", text: "" }]);
  }

  function appendHeading() {
    commit([...blocks, { id: `block-${blocks.length + 1}`, type: "heading", level: 2, text: "" }]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-white/48">
        <span>正文直编模式</span>
        <span>•</span>
        <span>默认隐藏 frontmatter 与托管标记</span>
        <span>•</span>
        <span>结构复杂时可切到高级模式</span>
      </div>
      <div className="space-y-5 rounded-[1.5rem] border border-white/8 bg-black/10 px-5 py-5">
        {blocks.map((block, index) => (
          <EditableBlockView key={block.id} block={block} onChange={(nextBlock) => updateBlock(index, nextBlock)} />
        ))}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-xs text-white/68 transition hover:border-white/20 hover:text-white"
            onClick={appendParagraph}
          >
            新增段落
          </button>
          <button
            type="button"
            className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-xs text-white/68 transition hover:border-white/20 hover:text-white"
            onClick={appendHeading}
          >
            新增二级标题
          </button>
        </div>
      </div>
    </div>
  );
}

function EditableBlockView({
  block,
  onChange,
}: {
  block: EditableBlock;
  onChange: (next: EditableBlock) => void;
}) {
  switch (block.type) {
    case "heading":
      return (
        <AutoTextarea
          value={block.text}
          onValueChange={(value) => onChange({ ...block, text: value })}
          className={cn(
            "w-full resize-none overflow-hidden bg-transparent outline-none",
            block.level === 1 && "text-4xl font-semibold tracking-tight leading-tight text-white",
            block.level === 2 && "border-b border-white/10 pb-3 text-[1.7rem] font-semibold tracking-tight text-white",
            block.level === 3 && "text-[1.28rem] font-semibold tracking-tight text-white"
          )}
          minRows={1}
        />
      );
    case "paragraph":
      return (
        <AutoTextarea
          value={block.text}
          onValueChange={(value) => onChange({ ...block, text: value })}
          className="w-full resize-none overflow-hidden bg-transparent text-[15px] leading-7 text-white/78 outline-none"
          minRows={2}
        />
      );
    case "blockquote":
      return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4">
          <AutoTextarea
            value={block.text}
            onValueChange={(value) => onChange({ ...block, text: value })}
            className="w-full resize-none overflow-hidden bg-transparent text-[15px] leading-7 text-white/80 outline-none"
            minRows={3}
          />
        </div>
      );
    case "unordered_list":
    case "ordered_list":
      return (
        <div className="space-y-3">
          {block.items.map((item, index) => (
            <div key={`${block.id}-${index}`} className="flex items-start gap-3">
              <span className="pt-2 text-sm text-accent">{block.type === "ordered_list" ? `${index + 1}.` : "•"}</span>
              <AutoTextarea
                value={item}
                onValueChange={(value) =>
                  onChange({
                    ...block,
                    items: block.items.map((current, currentIndex) => (currentIndex === index ? value : current)),
                  })
                }
                className="w-full resize-none overflow-hidden bg-transparent text-[15px] leading-7 text-white/78 outline-none"
                minRows={1}
              />
            </div>
          ))}
          <button
            type="button"
            className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs text-white/62 transition hover:border-white/20 hover:text-white"
            onClick={() => onChange({ ...block, items: [...block.items, ""] })}
          >
            新增列表项
          </button>
        </div>
      );
    case "code":
      return (
        <div className="rounded-3xl border border-white/10 bg-[#02050b] p-4">
          <div className="mb-2 text-xs uppercase tracking-[0.24em] text-white/42">{block.language || "code"}</div>
          <AutoTextarea
            value={block.text}
            onValueChange={(value) => onChange({ ...block, text: value })}
            className="w-full resize-none overflow-hidden bg-transparent font-mono text-[13px] leading-6 text-white/86 outline-none"
            minRows={6}
          />
        </div>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03]">
          <table className="min-w-full border-collapse text-sm">
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={`${block.id}-${rowIndex}`} className={rowIndex === 0 ? "bg-white/[0.04]" : ""}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${block.id}-${rowIndex}-${cellIndex}`} className="border-t border-white/8 px-3 py-3 align-top">
                      <AutoTextarea
                        value={cell}
                        onValueChange={(value) =>
                          onChange({
                            ...block,
                            rows: block.rows.map((currentRow, currentRowIndex) =>
                              currentRowIndex === rowIndex
                                ? currentRow.map((currentCell, currentCellIndex) => (currentCellIndex === cellIndex ? value : currentCell))
                                : currentRow
                            ),
                          })
                        }
                        className={cn(
                          "w-full resize-none overflow-hidden bg-transparent outline-none",
                          rowIndex === 0 ? "font-medium text-white" : "text-white/78"
                        )}
                        minRows={1}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "hr":
      return <hr className="my-8 border-white/10" />;
    case "raw":
      return (
        <AutoTextarea
          value={block.text}
          onValueChange={(value) => onChange({ ...block, text: value })}
          className="w-full resize-none overflow-hidden rounded-3xl border border-white/10 bg-black/20 px-4 py-4 font-mono text-sm leading-7 text-white/78 outline-none"
          minRows={4}
        />
      );
    default:
      return null;
  }
}

function AutoTextarea({
  value,
  onValueChange,
  className,
  minRows = 1,
}: {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    ref.current.style.height = "0px";
    ref.current.style.height = `${Math.max(ref.current.scrollHeight, minRows * 28)}px`;
  }, [value, minRows]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={minRows}
      onChange={(event) => onValueChange(event.target.value)}
      spellCheck={false}
      className={className}
    />
  );
}
