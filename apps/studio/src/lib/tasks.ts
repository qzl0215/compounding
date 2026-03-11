import type { BootstrapConfig, ProjectBrief, TaskBrief } from "./types";

export function buildTaskBrief(
  input: { task_goal: string; expected_output: string; notes: string },
  brief: ProjectBrief,
  resolved: BootstrapConfig | null
): TaskBrief {
  const constraints = [
    ...brief.must_protect,
    `运行边界：${brief.runtime_boundary}`,
    "关键改动先进入 Reviews，再决定是否写入仓库。"
  ];
  const suggestedContext = [
    "docs/PROJECT_CARD.md",
    "docs/OPERATING_RULES.md",
    resolved ? `Build Command: ${resolved.repo_scan.build_command}` : "Build Command: 待扫描",
    resolved ? `Test Command: ${resolved.repo_scan.test_command}` : "Test Command: 待扫描"
  ];
  const acceptance = [
    `交付必须满足：${input.expected_output}`,
    `不能破坏：${brief.must_protect.join(" / ")}`,
    "如果改动涉及文件写入，需生成 review summary 并等待确认。"
  ];

  const agentPrompt = [
    `任务目标：${input.task_goal}`,
    `项目背景：${brief.project_one_liner}`,
    `当前优先级：${brief.current_priority}`,
    `期望交付：${input.expected_output}`,
    `补充说明：${input.notes || "无"}`,
    `必须保护：${brief.must_protect.join("；")}`,
    `运行边界：${brief.runtime_boundary}`,
    "执行要求：先做最有 ROI 的动作，不做过度优化；关键改动进入 review。"
  ].join("\n");

  return {
    task_goal: input.task_goal,
    expected_output: input.expected_output,
    notes: input.notes,
    resolved_constraints: constraints,
    suggested_context: suggestedContext,
    acceptance_criteria: acceptance,
    review_mode: "summary-review",
    agent_prompt: agentPrompt
  };
}
