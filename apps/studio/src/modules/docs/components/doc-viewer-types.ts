import type { DocKind } from "@/modules/docs/content";
import type { PromptHistoryEntry } from "@/modules/docs/types";

export type ViewMode = "read" | "edit" | "advanced";

export type SaveResponse = {
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

export type PromptHistoryResponse = {
  ok: boolean;
  message?: string;
  history?: PromptHistoryEntry[];
  doc?: SaveResponse["doc"];
};
