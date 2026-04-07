export type RewriteIntensity = "light" | "medium" | "heavy";
export type RewriteAction = "clarify" | "rewrite";

export type ClarifyResult = {
  questions: string[];
  why: string[];
  assumptions_if_unanswered: string[];
};

export type RewriteResult = {
  rewritten_markdown: string;
  structure_summary: string[];
  missing_information: string[];
  keep_recommendations: string[];
  remove_recommendations: string[];
  intensity_note: string;
};

export type ProviderConfig = {
  apiKey: string | null;
  model: string | null;
  baseUrl: string;
  provider: string;
};

export type PromptDocPreview = {
  path: string;
  title: string;
  content: string;
};

export type ClarifyResponse = {
  ok: boolean;
  message?: string;
  provider?: string;
  model?: string;
  payload?: ClarifyResult;
};

export type RewriteResponse = {
  ok: boolean;
  message?: string;
  provider?: string;
  model?: string;
  payload?: RewriteResult;
};
