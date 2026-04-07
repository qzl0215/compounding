const fs = require("node:fs");
const path = require("node:path");

function loadHeadingAliases(root) {
  return JSON.parse(fs.readFileSync(path.join(root, "bootstrap", "heading_aliases.json"), "utf8"));
}

function resolveHeadingAliases(root, keyOrHeading) {
  const aliases = loadHeadingAliases(root);
  if (aliases[keyOrHeading]) {
    return aliases[keyOrHeading];
  }

  const normalized = normalizeHeading(keyOrHeading);
  for (const values of Object.values(aliases)) {
    if (values.some((value) => normalizeHeading(value) === normalized)) {
      return values;
    }
  }

  return [keyOrHeading];
}

function parseMarkdownSections(markdown) {
  const sections = { __root__: [] };
  let current = "__root__";

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

function extractSection(markdown, keyOrHeading, root) {
  const sections = parseMarkdownSections(markdown);
  const aliases = resolveHeadingAliases(root, keyOrHeading);

  for (const alias of aliases) {
    if (sections[alias]) {
      return sections[alias];
    }
  }

  return null;
}

function stripMarkdown(value) {
  return String(value || "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^#+\s+/gm, "")
    .trim();
}

function normalizeHeading(value) {
  return String(value || "").trim().toLowerCase();
}

module.exports = {
  extractSection,
  loadHeadingAliases,
  parseMarkdownSections,
  resolveHeadingAliases,
  stripMarkdown,
};
