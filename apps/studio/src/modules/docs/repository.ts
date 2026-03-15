import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { DocMeta, DocNode } from "./types";
import { getWorkspaceRoot } from "@/lib/workspace";

const workspaceRoot = getWorkspaceRoot();

const TOP_LEVEL_FILES = ["AGENTS.md", "README.md"] as const;
const LIVE_ROOTS = ["docs", "memory", "code_index", "tasks"] as const;
const FOLDED_DIRS = new Set(["archive"]);

export async function getDocTree() {
  const nodes: DocNode[] = TOP_LEVEL_FILES.map((file) => ({ name: file, path: file }));
  for (const root of LIVE_ROOTS) {
    const absolute = path.join(workspaceRoot, root);
    try {
      await fs.access(absolute);
    } catch {
      continue;
    }
    nodes.push({
      name: root,
      path: root,
      defaultExpanded: true,
      children: await walkDocsDir(absolute, root)
    });
  }
  return nodes;
}

export async function listMarkdownDocs() {
  const tree = await getDocTree();
  const flat: string[] = [];

  const visit = (nodes: DocNode[]) => {
    for (const node of nodes) {
      if (node.children?.length) {
        visit(node.children);
      } else if (node.path.endsWith(".md")) {
        flat.push(node.path);
      }
    }
  };

  visit(tree);
  return flat;
}

export async function listDocsUnder(prefix: string) {
  const normalized = prefix.replace(/^\/+/, "").replace(/\/+$/, "");
  return (await listMarkdownDocs()).filter((item) => item === normalized || item.startsWith(`${normalized}/`));
}

export async function readDoc(relativePath: string) {
  const normalized = relativePath.replace(/^\/+/, "");
  const absolute = resolveDocPath(normalized);
  const raw = await fs.readFile(absolute, "utf8");
  const { content, data } = matter(raw);
  const renderedContent = absolute.endsWith(".json") ? renderJsonAsMarkdown(raw) : sanitizeManagedBlocks(content);
  return {
    content: renderedContent,
    meta: normalizeFrontmatter(data) as DocMeta,
    absolutePath: absolute
  };
}

function resolveDocPath(normalized: string) {
  if (TOP_LEVEL_FILES.includes(normalized as (typeof TOP_LEVEL_FILES)[number])) {
    return path.join(workspaceRoot, normalized);
  }
  const allowed = LIVE_ROOTS.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
  if (!allowed) {
    throw new Error(`Unsupported doc path: ${normalized}`);
  }
  return path.join(workspaceRoot, normalized);
}

async function walkDocsDir(absoluteDir: string, relativeDir: string): Promise<DocNode[]> {
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
  const nodes = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith("."))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async (entry) => {
        const relativePath = path.posix.join(relativeDir, entry.name);
        const absolutePath = path.join(absoluteDir, entry.name);
        if (entry.isDirectory()) {
          return {
            name: entry.name,
            path: relativePath,
            defaultExpanded: !FOLDED_DIRS.has(entry.name),
            children: await walkDocsDir(absolutePath, relativePath)
          } satisfies DocNode;
        }
        return {
          name: entry.name,
          path: relativePath
        } satisfies DocNode;
      })
  );

  return nodes.filter((node) => node.children?.length !== 0 || node.path.endsWith(".md") || node.path.endsWith(".json"));
}

function sanitizeManagedBlocks(content: string) {
  return content
    .replace(/<!-- BEGIN MANAGED BLOCK: [A-Z_]+ -->\n?/g, "")
    .replace(/\n?<!-- END MANAGED BLOCK: [A-Z_]+ -->/g, "")
    .trim();
}

function renderJsonAsMarkdown(raw: string) {
  try {
    return `\`\`\`json\n${JSON.stringify(JSON.parse(raw), null, 2)}\n\`\`\``;
  } catch {
    return `\`\`\`json\n${raw.trim()}\n\`\`\``;
  }
}

function normalizeFrontmatter(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeFrontmatter(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeFrontmatter(item)]));
  }
  return value;
}
