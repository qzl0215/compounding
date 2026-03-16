import { describe, expect, it } from "vitest";
import { extractEditableMarkdown, mergeEditableMarkdown } from "../content";

describe("docs content helpers", () => {
  it("extracts only canonical body markdown from managed documents", () => {
    const raw = `---
title: SAMPLE
---
before
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 标题

正文
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
after
`;

    expect(extractEditableMarkdown(raw, "markdown")).toBe("# 标题\n\n正文");
  });

  it("preserves frontmatter and managed block wrappers when saving body edits", () => {
    const raw = `---
title: SAMPLE
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 标题

正文
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

## 人工备注

保留
`;

    const merged = mergeEditableMarkdown(raw, "# 新标题\n\n新正文", "markdown");

    expect(merged).toContain("title: SAMPLE");
    expect(merged).toContain("<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->");
    expect(merged).toContain("# 新标题");
    expect(merged).toContain("新正文");
    expect(merged).toContain("## 人工备注");
    expect(merged).toContain("保留");
  });

  it("defensively strips duplicated frontmatter when body mode receives full markdown", () => {
    const original = `---
title: SAMPLE
---

# 标题

正文
`;

    const merged = mergeEditableMarkdown(original, `${original}\n补充`, "markdown");

    expect(merged.match(/^---/gm)?.length).toBe(2);
    expect(merged).not.toContain("---\n---");
    expect(merged).toContain("# 标题");
    expect(merged).toContain("补充");
  });
});
