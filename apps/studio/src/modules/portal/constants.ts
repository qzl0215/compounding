import type { HomeEntryLink } from "./types";

export const DEFAULT_DOC_PATH = "AGENTS.md";

export const HOME_ENTRY_LINKS: HomeEntryLink[] = [
  { href: "/tasks", label: "执行面板", description: "看真正可推进的事项。", scope: "tasks" },
  { href: "/releases", label: "发布事实", description: "看待验收版本、运行态和发布历史。", scope: "release" },
  { href: "/knowledge-base", label: "证据库", description: "看主源、规则和背景。", scope: "memory" },
];
