const { runJsonNodeScript } = require("./pre-task-runtime.ts");

function buildDecisionOptions({ preflightCheck, runtimeCheck, scopeCheck, lockCheck }) {
  const runtimeIssueCount = runtimeCheck.blockers.length;
  const scopeIssueCount = (scopeCheck.high_risk_undeclared || []).length;
  const lockIssueCount = (lockCheck.conflicts || []).length;
  const preflightIssueCount = preflightCheck.blockers.length;
  return [
    {
      option_id: "A",
      title: "先修复后重试",
      summary: "先整理工作区、处理运行态、锁冲突和 scope 风险，再重新执行 pre-task。",
      user_visible_impact: "当前任务暂不进入执行，保留原边界。",
      benefits: ["避免越界扩散", "减少半途返工"],
      risks: ["需要先处理阻塞项"],
      scope: "runtime / scope / lock blockers",
      rollback_cost: "low",
      confidence: Math.max(0.7, 1 - (runtimeIssueCount + scopeIssueCount + lockIssueCount + preflightIssueCount) * 0.1),
      recommended: true,
    },
    {
      option_id: "B",
      title: "缩小范围再试",
      summary: "先收缩 planned_files 或调整任务边界，再重新进入 pre-task。",
      user_visible_impact: "任务仍可继续，但需要先明确更小的 scope。",
      benefits: ["可快速收口", "降低协调成本"],
      risks: ["可能延后交付"],
      scope: "task scope",
      rollback_cost: "none",
      confidence: 0.85,
      recommended: scopeIssueCount > 0 && runtimeIssueCount === 0 && lockIssueCount === 0,
    },
    {
      option_id: "C",
      title: "人工裁决",
      summary: "由人先确认是否需要调整模式、锁状态或当前运行态。",
      user_visible_impact: "暂停自动推进，等待人工确认。",
      benefits: ["最安全", "避免误判"],
      risks: ["流转变慢"],
      scope: "human review",
      rollback_cost: "none",
      confidence: 1,
      recommended: false,
    },
  ];
}

function createDecisionCard(taskId, preflightCheck, runtimeCheck, scopeCheck, lockCheck) {
  const summaryParts = [];
  if (preflightCheck.blockers.length > 0) {
    summaryParts.push(`preflight blockers: ${preflightCheck.blockers.map((item) => item.issue).join(", ")}`);
  }
  if (runtimeCheck.blockers.length > 0) {
    summaryParts.push(
      `runtime blockers: ${runtimeCheck.blockers.map((item) => `${item.label}:${item.status}`).join(", ")}`
    );
  }
  if ((scopeCheck.high_risk_undeclared || []).length > 0) {
    summaryParts.push(`high risk scope: ${scopeCheck.high_risk_undeclared.join(", ")}`);
  }
  if ((lockCheck.conflicts || []).length > 0) {
    summaryParts.push(`lock conflicts: ${lockCheck.conflicts.map((item) => `${item.target} <- ${item.owner_task_id}`).join(", ")}`);
  }

  if (summaryParts.length === 0) {
    return { ok: true, decision: null };
  }

  const options = buildDecisionOptions({ preflightCheck, runtimeCheck, scopeCheck, lockCheck });
  const result = runJsonNodeScript("scripts/coord/decision.ts", [
    "--type=pre_task_guard",
    `--taskId=${taskId}`,
    `--options=${JSON.stringify(options)}`,
    `--diff_summary=${summaryParts.join("; ")}`,
    "--key_pages=/tasks,/releases",
  ]);

  return result.parsed || { ok: false, error: "Failed to create decision card.", raw: { stdout: result.stdout, stderr: result.stderr } };
}

module.exports = {
  createDecisionCard,
};
