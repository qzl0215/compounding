import { describe, expect, it } from "vitest";
import { getDocTree, listDocsUnder, readDoc } from "../repository";
import { DEFAULT_DOC_PATH, HOME_ENTRY_LINKS, getSemanticEntryGroups } from "@/modules/portal";

describe("docs repository", () => {
  it("keeps the live reading tree centered on AGENTS, docs, memory, code_index, and tasks", async () => {
    const tree = await getDocTree();

    expect(DEFAULT_DOC_PATH).toBe("AGENTS.md");
    expect(tree[0]?.path).toBe(DEFAULT_DOC_PATH);
    expect(tree.some((node) => node.path === "docs")).toBe(true);
    expect(tree.some((node) => node.path === "memory")).toBe(true);
    expect(tree.some((node) => node.path === "code_index")).toBe(true);
    expect(tree.some((node) => node.path === "tasks")).toBe(true);

    const docsNode = tree.find((node) => node.path === "docs");
    const memoryNode = tree.find((node) => node.path === "memory");
    expect(docsNode?.children?.some((node) => node.path === "docs/PROJECT_RULES.md")).toBe(true);
    expect(docsNode?.children?.some((node) => node.path === "docs/ORG_MODEL.md")).toBe(true);
    expect(docsNode?.children?.some((node) => node.path === "docs/WORK_MODES.md")).toBe(true);
    expect(memoryNode?.children?.some((node) => node.path === "memory/project")).toBe(true);
  });

  it("keeps the home entry links focused on evidence, execution, and release entry points", () => {
    expect(HOME_ENTRY_LINKS).toEqual([
      { href: "/knowledge-base", label: "证据库", description: "看主源、规则和背景。", scope: "memory" },
      { href: "/tasks", label: "执行面板", description: "看真正可推进的事项。", scope: "tasks" },
      { href: "/releases", label: "发布事实", description: "看验收、版本和运行态。", scope: "release" }
    ]);
  });

  it("normalizes frontmatter values and strips managed block markers when reading docs", async () => {
    const rules = await readDoc("docs/PROJECT_RULES.md");
    const currentState = await readDoc("memory/project/current-state.md");
    const functionIndex = await readDoc("code_index/function-index.json");

    expect(typeof rules.meta.last_reviewed_at).toBe("string");
    expect(rules.content).not.toContain("BEGIN MANAGED BLOCK");
    expect(rules.rawContent).toContain("---");
    expect(rules.editable).toBe(true);
    expect(rules.kind).toBe("markdown");
    expect(rules.hasManagedBlocks).toBe(true);
    expect(currentState.absolutePath.endsWith("memory/project/current-state.md")).toBe(true);
    expect(functionIndex.content).toContain("```json");
    expect(functionIndex.editable).toBe(false);
    expect(functionIndex.kind).toBe("json");
  });

  it("builds semantic entry groups and queue filters from the live docs tree", async () => {
    const [groups, queueDocs] = await Promise.all([getSemanticEntryGroups(), listDocsUnder("tasks/queue")]);

    expect(groups.some((group) => group.title === "项目全貌")).toBe(true);
    expect(groups.some((group) => group.title === "待思考证据")).toBe(true);
    expect(groups.some((group) => group.title === "待规划证据")).toBe(true);
    expect(groups.some((group) => group.title === "执行规则")).toBe(true);
    expect(groups.some((group) => group.title === "发布事实")).toBe(true);
    expect(groups.flatMap((group) => group.items).some((item) => item.path === "tasks/queue/task-001-repo-refactor.md")).toBe(false);
    expect(queueDocs).toContain("tasks/queue/task-001-repo-refactor.md");
  });
});
