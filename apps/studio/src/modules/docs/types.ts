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
