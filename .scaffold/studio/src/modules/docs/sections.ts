import headingAliases from "../../../../../bootstrap/heading_aliases.json";

type HeadingAliasMap = Record<string, string[]>;

const ALIASES = headingAliases as HeadingAliasMap;
const HEADING_PATTERN = /^(#{1,3})\s+(.+)$/;

export type SectionMap = Record<string, string>;

export function extractHeadings(content: string) {
  return content
    .split("\n")
    .map((line) => line.match(HEADING_PATTERN))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => {
      const label = match[2].trim();
      return {
        depth: match[1].length,
        label,
        id: slugify(label),
      };
    });
}

export function extractSection(content: string, keyOrHeading: string) {
  const sections = parseMarkdownSections(content);
  const aliases = resolveHeadingAliases(keyOrHeading);

  for (const alias of aliases) {
    if (sections[alias]) {
      return sections[alias];
    }
  }

  return null;
}

export function extractFirstHeading(content: string) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

export function parseMarkdownSections(markdown: string): SectionMap {
  const sections: Record<string, string[]> = {};
  let current = "__root__";
  sections[current] = [];

  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      current = heading[1].trim();
      sections[current] = [];
      continue;
    }
    sections[current].push(line);
  }

  return Object.fromEntries(Object.entries(sections).map(([key, lines]) => [key, lines.join("\n").trim()]));
}

export function stripMarkdown(value: string) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^#+\s+/gm, "")
    .trim();
}

export function resolveHeadingAliases(keyOrHeading: string) {
  const direct = ALIASES[keyOrHeading];
  if (direct) {
    return direct;
  }

  for (const aliases of Object.values(ALIASES)) {
    if (aliases.some((alias) => normalizeHeading(alias) === normalizeHeading(keyOrHeading))) {
      return aliases;
    }
  }

  return [keyOrHeading];
}

function normalizeHeading(value: string) {
  return value.trim().toLowerCase();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
    .replace(/\s+/g, "-");
}
