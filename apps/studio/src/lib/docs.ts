import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { DocMeta, DocNode } from "./types";
import { getWorkspaceRoot } from "./workspace";

const docsRoot = path.join(getWorkspaceRoot(), "docs");

async function walk(relativeDir = ""): Promise<DocNode[]> {
  const absolute = path.join(docsRoot, relativeDir);
  const entries = await fs.readdir(absolute, { withFileTypes: true });

  return Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith("."))
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(async (entry) => {
        const entryPath = path.join(relativeDir, entry.name);
        if (entry.isDirectory()) {
          return {
            name: entry.name,
            path: entryPath.replaceAll(path.sep, "/"),
            children: await walk(entryPath)
          } satisfies DocNode;
        }

        return {
          name: entry.name,
          path: entryPath.replaceAll(path.sep, "/")
        } satisfies DocNode;
      })
  );
}

export async function getDocTree() {
  return walk();
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

export async function readDoc(relativePath: string) {
  const normalized = relativePath.replace(/^\/+/, "");
  const absolute = path.join(docsRoot, normalized);
  const raw = await fs.readFile(absolute, "utf8");
  const { content, data } = matter(raw);
  return {
    content,
    meta: data as DocMeta,
    absolutePath: absolute
  };
}
