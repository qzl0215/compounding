import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { detectDocKind, hasManagedBlocks, mergeEditableMarkdown, renderDocContent } from "./content";
import type { DocMeta, DocNode, DocRecord, PromptHistoryEntry } from "./types";
import { getWorkspaceRoot } from "@/lib/workspace";

const workspaceRoot = getWorkspaceRoot();
const promptHistoryRoot = path.join(workspaceRoot, "output", "prompt-history");

const TOP_LEVEL_FILES = ["AGENTS.md", "README.md"] as const;
const LIVE_ROOTS = ["docs", "memory", "code_index", "tasks"] as const;
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

export async function readDoc(relativePath: string): Promise<DocRecord> {
  const normalized = relativePath.replace(/^\/+/, "");
  const absolute = resolveDocPath(normalized);
  const raw = await fs.readFile(absolute, "utf8");
  const { data } = matter(raw);
  const kind = detectDocKind(normalized);
  return {
    content: renderDocContent(raw, kind),
    rawContent: raw,
    meta: normalizeFrontmatter(data) as DocMeta,
    absolutePath: absolute,
    relativePath: normalized,
    kind,
    editable: kind === "markdown",
    hasManagedBlocks: hasManagedBlocks(raw),
  };
}

export async function writeMarkdownDoc(relativePath: string, rawContent: string) {
  return writeDoc(relativePath, rawContent, "raw");
}

export async function writeDoc(relativePath: string, content: string, mode: "body" | "raw" = "raw") {
  const normalized = relativePath.replace(/^\/+/, "");
  if (!normalized.endsWith(".md")) {
    throw new Error("Only Markdown documents can be edited.");
  }

  const absolute = resolveDocPath(normalized);
  const previousRaw = await fs.readFile(absolute, "utf8");
  const nextRaw = mode === "body" ? mergeEditableMarkdown(previousRaw, content, "markdown") : content;
  matter(nextRaw);

  await backupPromptDoc(normalized, previousRaw, nextRaw);
  await fs.writeFile(absolute, nextRaw, "utf8");
  return readDoc(normalized);
}

export async function listPromptHistory(relativePath: string): Promise<PromptHistoryEntry[]> {
  const normalized = relativePath.replace(/^\/+/, "");
  if (!isPromptDoc(normalized)) {
    return [];
  }
  const historyDir = promptHistoryDir(normalized);
  try {
    const entries = await fs.readdir(historyDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .sort((left, right) => right.name.localeCompare(left.name))
      .map((entry) => {
        const versionId = entry.name.replace(/\.md$/, "");
        return {
          versionId,
          createdAt: versionId,
          label: versionId.replace(/[-T]/g, " "),
        };
      });
  } catch {
    return [];
  }
}

export async function rollbackPromptDoc(relativePath: string, versionId: string) {
  const normalized = relativePath.replace(/^\/+/, "");
  if (!isPromptDoc(normalized)) {
    throw new Error("Only prompt documents support rollback.");
  }

  const historyPath = path.join(promptHistoryDir(normalized), `${versionId}.md`);
  const snapshot = await fs.readFile(historyPath, "utf8");
  return writeDoc(normalized, snapshot, "raw");
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

function promptHistoryDir(relativePath: string) {
  const slug = relativePath.replace(/[\\/]/g, "__").replace(/\.md$/, "");
  return path.join(promptHistoryRoot, slug);
}

function isPromptDoc(relativePath: string) {
  return relativePath.startsWith("docs/prompts/");
}

async function backupPromptDoc(relativePath: string, previousRaw: string, nextRaw: string) {
  if (!isPromptDoc(relativePath) || previousRaw === nextRaw) {
    return;
  }

  const historyDir = promptHistoryDir(relativePath);
  await fs.mkdir(historyDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await fs.writeFile(path.join(historyDir, `${stamp}.md`), previousRaw, "utf8");
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
            defaultExpanded: true,
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
