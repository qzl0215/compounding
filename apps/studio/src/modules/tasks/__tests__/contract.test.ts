import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseTaskContract, parseTaskMachineFacts } from "../../../../../../shared/task-contract";

const ROOT = path.resolve(process.cwd(), "..", "..");
const TASK_PATH = path.join(ROOT, "tasks", "queue", "task-001-repo-refactor.md");

describe("task contract boundary", () => {
  it("keeps human contract separate from machine facts", () => {
    const content = fs.readFileSync(TASK_PATH, "utf8");
    const contract = parseTaskContract("tasks/queue/task-001-repo-refactor.md", content);
    const machine = parseTaskMachineFacts(content);

    expect(contract).not.toHaveProperty("currentMode");
    expect(contract).not.toHaveProperty("branch");
    expect(contract).not.toHaveProperty("recentCommit");
    expect(contract).not.toHaveProperty("relatedModules");
    expect(contract).not.toHaveProperty("primaryRelease");
    expect(contract).not.toHaveProperty("linkedReleases");

    expect(machine.deliveryTrack).toBeTruthy();
    expect(machine.branch).toBeTruthy();
    expect(Array.isArray(machine.relatedModules)).toBe(true);
  });

  it("uses summary as title when heading is only a task id wrapper", () => {
    const contract = parseTaskContract(
      "tasks/queue/task-777-sample.md",
      `# 任务 task-777-sample

## 任务摘要

- 短编号：\`t-777\`
- 父计划：\`memory/project/operating-blueprint.md\`
- 任务摘要：
  任务标题只用中文直给概述
- 为什么现在：
  需要让任务列表先对人可扫读。
- 承接边界：
  只改标题解析。
- 完成定义：
  任务列表默认展示中文概述。
`
    );

    expect(contract.title).toBe("任务标题只用中文直给概述");
  });

  it("keeps explicit Chinese heading when task already has a human title", () => {
    const contract = parseTaskContract(
      "tasks/queue/task-778-sample.md",
      `# 统一任务标题命名

## 任务摘要

- 短编号：\`t-778\`
- 父计划：\`memory/project/operating-blueprint.md\`
- 任务摘要：
  标题摘要
- 为什么现在：
  需要保持任务标题直接可读。
- 承接边界：
  只改标题展示。
- 完成定义：
  明确保留已有中文标题。
`
    );

    expect(contract.title).toBe("统一任务标题命名");
  });

  it("parses governance binding fields as part of the human contract", () => {
    const contract = parseTaskContract(
      "tasks/queue/task-779-sample.md",
      `# 收口治理绑定

## 任务摘要

- 短编号：\`t-779\`
- 父计划：\`memory/project/operating-blueprint.md\`
- 任务摘要：
  收口治理绑定
- 为什么现在：
  需要让 task 合法承接治理 gap。
- 承接边界：
  只补治理绑定字段。
- 完成定义：
  task、解析器与校验器都能识别治理绑定。

## 治理绑定

- 主治理差距：\`GOV-GAP-01\`
- 来源断言：\`A4\`
- 回写目标：
  - \`Current\`
  - \`Tests\`
`
    );

    expect(contract.linkedGap).toBe("GOV-GAP-01");
    expect(contract.fromAssertion).toBe("A4");
    expect(contract.writebackTargets).toEqual(["Current", "Tests"]);
  });
});
