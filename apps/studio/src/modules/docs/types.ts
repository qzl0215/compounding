import type { DocKind } from "./content";

export type DocMeta = {
  title?: string;
  doc_role?: string;
  update_mode?: string;
  owner_role?: string;
  status?: string;
  last_reviewed_at?: string;
  source_of_truth?: string;
  related_docs?: string[];
};

export type DocNode = {
  name: string;
  path: string;
  children?: DocNode[];
  defaultExpanded?: boolean;
};

export type DocRecord = {
  content: string;
  rawContent: string;
  meta: DocMeta;
  absolutePath: string;
  relativePath: string;
  kind: DocKind;
  editable: boolean;
  hasManagedBlocks: boolean;
};

export type PromptHistoryEntry = {
  versionId: string;
  createdAt: string;
  label: string;
};
