export type DocKind = "markdown" | "json";

export function detectDocKind(relativePath: string): DocKind {
  return relativePath.endsWith(".json") ? "json" : "markdown";
}

export function hasManagedBlocks(rawContent: string) {
  return /<!-- BEGIN MANAGED BLOCK: [A-Z_]+ -->/.test(rawContent);
}

export function hasCanonicalManagedBlock(rawContent: string) {
  return /<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->/.test(rawContent);
}

export function stripFrontmatter(rawContent: string) {
  if (!rawContent.startsWith("---")) {
    return rawContent;
  }
  return rawContent.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

export function extractFrontmatter(rawContent: string) {
  const match = rawContent.match(/^(---\r?\n[\s\S]*?\r?\n---)\r?\n?/);
  return match ? match[1] : null;
}

export function sanitizeManagedBlocks(content: string) {
  return content
    .replace(/<!-- BEGIN MANAGED BLOCK: [A-Z_]+ -->\n?/g, "")
    .replace(/\n?<!-- END MANAGED BLOCK: [A-Z_]+ -->/g, "")
    .trim();
}

export function extractEditableMarkdown(rawContent: string, kind: DocKind) {
  if (kind === "json") {
    return renderJsonAsMarkdown(rawContent);
  }

  const withoutFrontmatter = stripFrontmatter(rawContent);
  const canonical = extractCanonicalManagedContent(withoutFrontmatter);
  if (canonical !== null) {
    return canonical.trim();
  }
  return sanitizeManagedBlocks(withoutFrontmatter);
}

export function mergeEditableMarkdown(originalRaw: string, editableMarkdown: string, kind: DocKind) {
  if (kind === "json") {
    return editableMarkdown;
  }

  const normalizedBody = normalizeMarkdownPayload(normalizeEditableBody(editableMarkdown, kind));
  const frontmatter = extractFrontmatter(originalRaw);
  const withoutFrontmatter = stripFrontmatter(originalRaw);

  if (hasCanonicalManagedBlock(originalRaw)) {
    const replaced = replaceCanonicalManagedContent(withoutFrontmatter, normalizedBody);
    return frontmatter ? `${frontmatter}\n${replaced}` : replaced;
  }

  return frontmatter ? `${frontmatter}\n${normalizedBody}` : normalizedBody;
}

export function renderJsonAsMarkdown(rawContent: string) {
  try {
    return `\`\`\`json\n${JSON.stringify(JSON.parse(rawContent), null, 2)}\n\`\`\``;
  } catch {
    return `\`\`\`json\n${rawContent.trim()}\n\`\`\``;
  }
}

export function renderDocContent(rawContent: string, kind: DocKind) {
  return extractEditableMarkdown(rawContent, kind);
}

function extractCanonicalManagedContent(content: string) {
  const match = content.match(
    /<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->\r?\n([\s\S]*?)\r?\n<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->/
  );
  return match ? match[1] : null;
}

function replaceCanonicalManagedContent(content: string, editableMarkdown: string) {
  return content.replace(
    /(<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->\r?\n)([\s\S]*?)(\r?\n<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->)/,
    (_, start, __body, end) => `${start}${editableMarkdown.trimEnd()}\n${end.replace(/^\r?\n/, "")}`
  );
}

function normalizeMarkdownPayload(value: string) {
  const trimmed = value.replace(/\r\n/g, "\n").trimEnd();
  return `${trimmed}\n`;
}

function normalizeEditableBody(value: string, kind: DocKind) {
  if (kind === "json") {
    return value;
  }
  if (value.startsWith("---") || hasManagedBlocks(value)) {
    return extractEditableMarkdown(value, kind);
  }
  return value;
}
