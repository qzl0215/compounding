import Link from "next/link";
import { ChevronRight, FileText, FolderTree } from "lucide-react";
import type { DocNode } from "../types";
import { cn } from "@/lib/classnames";

type Props = {
  nodes: DocNode[];
  selectedPath: string;
  depth?: number;
};

export function DocTree({ nodes, selectedPath, depth = 0 }: Props) {
  return (
    <ul className={cn("space-y-1", depth > 0 && "mt-1 border-l border-slate-200 pl-4")}>
      {nodes.map((node) => {
        const active = node.path === selectedPath;
        return (
          <li key={node.path}>
            {node.children?.length ? (
              <details open={node.defaultExpanded ?? true} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-slate-700 marker:hidden">
                  <FolderTree className="size-4 text-sky-600" />
                  <span>{node.name}</span>
                </summary>
                <DocTree nodes={node.children} selectedPath={selectedPath} depth={depth + 1} />
              </details>
            ) : (
              <Link
                href={`/knowledge-base?path=${encodeURIComponent(node.path)}`}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition",
                  active
                    ? "border-sky-200 bg-sky-50 text-slate-900"
                    : "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <FileText className="size-4" />
                <span className="flex-1 truncate">{node.name}</span>
                <ChevronRight className="size-4 text-slate-400" />
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
