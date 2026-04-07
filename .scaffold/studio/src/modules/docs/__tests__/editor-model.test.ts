import { describe, expect, it } from "vitest";
import { parseEditableMarkdown, stringifyEditableMarkdown } from "../editor-model";

describe("editor model", () => {
  it("round-trips structured markdown blocks", () => {
    const source = `# 路线图

## 当前阶段

知识库富文本直编与两步 AI 文档重构收口

- 第一项
- 第二项

> 引用内容

\`\`\`md
代码块
\`\`\`

| 列一 | 列二 |
| --- | --- |
| A | B |
`;

    const blocks = parseEditableMarkdown(source);
    const output = stringifyEditableMarkdown(blocks);

    expect(blocks.some((block) => block.type === "heading")).toBe(true);
    expect(blocks.some((block) => block.type === "unordered_list")).toBe(true);
    expect(blocks.some((block) => block.type === "blockquote")).toBe(true);
    expect(blocks.some((block) => block.type === "code")).toBe(true);
    expect(blocks.some((block) => block.type === "table")).toBe(true);
    expect(output).toContain("# 路线图");
    expect(output).toContain("## 当前阶段");
    expect(output).toContain("- 第一项");
    expect(output).toContain("> 引用内容");
    expect(output).toContain("| 列一 | 列二 |");
  });
});
