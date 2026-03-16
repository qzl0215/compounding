export type DocKind = "markdown" | "json";

export function detectDocKind(relativePath: string): DocKind {
  return relativePath.endsWith(".json") ? "json" : "markdown";
}

export function hasManagedBlocks(rawContent: string) {
  return /<!-- BEGIN MANAGED BLOCK: [A-Z_]+ -->/.test(rawContent);
}

export function stripFrontmatter(rawContent: string) {
  if (!rawContent.startsWith("---")) {
    return rawContent;
  }
  return rawContent.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

export function sanitizeManagedBlocks(content: string) {
  return content
    .replace(/<!-- BEGIN MANAGED BLOCK: [A-Z_]+ -->\n?/g, "")
    .replace(/\n?<!-- END MANAGED BLOCK: [A-Z_]+ -->/g, "")
    .trim();
}

export function renderJsonAsMarkdown(rawContent: string) {
  try {
    return `\`\`\`json\n${JSON.stringify(JSON.parse(rawContent), null, 2)}\n\`\`\``;
  } catch {
    return `\`\`\`json\n${rawContent.trim()}\n\`\`\``;
  }
}

export function renderDocContent(rawContent: string, kind: DocKind) {
  if (kind === "json") {
    return renderJsonAsMarkdown(rawContent);
  }

  return sanitizeManagedBlocks(stripFrontmatter(rawContent));
}
