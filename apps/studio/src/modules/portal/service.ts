import type { HomeEntryLink } from "./types";

export const DEFAULT_DOC_PATH = "AGENTS.md";

export const HOME_ENTRY_LINKS: HomeEntryLink[] = [
  { href: "/knowledge-base?path=AGENTS.md", label: "打开 AGENTS", scope: "agents" },
  { href: "/knowledge-base?path=memory/project/roadmap.md", label: "查看路线图", scope: "roadmap" },
  { href: "/knowledge-base?path=memory/project/current-state.md", label: "查看当前状态", scope: "memory" }
];

export function extractSection(content: string, heading: string) {
  const pattern = new RegExp(`## ${escapeRegExp(heading)}\\n\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = content.match(pattern);
  return match ? match[1].trim() : null;
}

export function formatWorktreeStatus(value: string) {
  if (!value.trim()) {
    return "干净";
  }
  return value;
}

export function formatSyncStatus(value: string) {
  const labels: Record<string, string> = {
    no_remote: "无远端",
    no_upstream: "无上游分支",
    fetch_failed: "拉取远端失败",
    sync_unknown: "同步状态未知",
    diverged: "已分叉",
    behind: "落后于上游",
    ahead: "领先于上游",
    up_to_date: "已同步"
  };
  return labels[value] ?? value;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
