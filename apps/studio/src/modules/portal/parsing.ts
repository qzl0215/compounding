import { stripMarkdown } from "@/modules/docs";

export function parseBulletMap(content: string) {
  const map: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const match = line.trim().match(/^-\s*([^：:]+)[：:]\s*(.+)$/);
    if (match) {
      map[match[1].trim()] = stripMarkdown(match[2].trim());
    }
  }
  return map;
}

export function parseBulletList(content: string) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^-+\s*/, ""))
    .map((line) => stripMarkdown(line))
    .filter(Boolean);
}

export function normalizeInline(value: string) {
  return stripMarkdown(value).replace(/\s+/g, " ").trim();
}

