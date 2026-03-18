#!/usr/bin/env node
/**
 * Decision card generator: outputs structured decision JSON for human choice.
 * Usage: node --experimental-strip-types scripts/coord/decision.ts [--type=merge_choice] [--taskId=t-025]
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const DECISIONS_DIR = path.join(ROOT, "agent-coordination", "decisions");

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith("--")) {
      const [key, val] = arg.slice(2).split("=");
      args[key] = val !== undefined ? val : true;
    }
  }
  return args;
}

function generateDecisionId() {
  return "dec-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
}

function main() {
  const args = parseArgs();
  const decisionType = args.type || "merge_choice";
  const taskId = args.taskId || null;
  const optionsJson = args.options;

  let options = [
    {
      option_id: "A",
      title: "自动合并",
      summary: "当前改动通过所有 reviewer，建议自动合并到 dev。",
      user_visible_impact: "改动将进入 dev 预览。",
      benefits: ["无需人工介入", "快速流转"],
      risks: ["若有遗漏需后续修复"],
      scope: "当前 task 声明范围",
      rollback_cost: "low",
      confidence: 0.9,
      recommended: true,
    },
    {
      option_id: "B",
      title: "暂不合并",
      summary: "暂不合并，继续完善后再提交。",
      user_visible_impact: "改动保留在分支，不进入 dev。",
      benefits: ["可继续修改", "无发布风险"],
      risks: ["延迟交付"],
      scope: "无",
      rollback_cost: "none",
      confidence: 1,
      recommended: false,
    },
  ];

  if (optionsJson) {
    try {
      options = JSON.parse(optionsJson);
    } catch (_) {}
  }

  const decision = {
    decision_id: generateDecisionId(),
    related_tasks: taskId ? [taskId] : [],
    decision_type: decisionType,
    options,
    required_human_input: `请选择 ${options.map((o) => o.option_id).join(" / ")}`,
    generated_at: new Date().toISOString(),
  };

  fs.mkdirSync(DECISIONS_DIR, { recursive: true });
  const outPath = path.join(DECISIONS_DIR, `${decision.decision_id}.json`);
  fs.writeFileSync(outPath, JSON.stringify(decision, null, 2) + "\n");

  const output = { ok: true, decision_id: decision.decision_id, path: outPath, decision };
  console.log(JSON.stringify(output, null, 2));
}

main();
