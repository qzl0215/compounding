#!/usr/bin/env node

/**
 * Diff-aware QA Orchestrator
 *
 * 基于改动范围自动生成测试关注点、证据落点与结构化 review / retro / ship log。
 * 产物保持轻量，不引入独立评估平台。
 */

const { collectDiffAwareArtifact } = require("../../apps/studio/src/modules/delivery/diff-aware.ts");

function main() {
  console.log("🔍 Diff-aware QA 分析开始...\n");

  const result = collectDiffAwareArtifact();

  console.log("📋 QA 分析摘要:");
  console.log("  " + result.summary);
  console.log("");

  console.log("💯 健康评分:");
  console.log(`  评分: ${result.healthScore.score}/100 (${result.healthScore.grade}级)`);
  console.log(`  原因: ${result.healthScore.reason}`);
  console.log("");

  console.log("🧭 Scope 摘要:");
  console.log("  " + result.scopeSummary);
  console.log("");

  console.log("📝 Review 摘要:");
  console.log("  " + result.reviewSummary);
  console.log("");

  console.log("🪪 Retro 摘要:");
  console.log("  " + result.retroSummary);
  console.log("");

  if (result.suggestedChecks.length > 0) {
    console.log("🧪 建议检查:");
    result.suggestedChecks.forEach((layer, index) => {
      console.log(`  ${index + 1}. ${layer.title}`);
      console.log(`     何时跑: ${layer.runWhen}`);
      console.log(`     失败说明: ${layer.failureMeaning}`);
      console.log(`     推荐命令: ${layer.commands.join(" | ")}`);
      console.log("");
    });
  }

  if (result.shipLog.length > 0) {
    console.log("🧾 Ship Log:");
    result.shipLog.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item}`);
    });
    console.log("");
  }

  if (result.evidencePoints.length > 0) {
    console.log("📁 证据落点:");
    result.evidencePoints.forEach((point, index) => {
      console.log(`  ${index + 1}. ${point}`);
    });
    console.log("");
  }

  if (result.nextActions.length > 0) {
    console.log("🎯 建议动作:");
    result.nextActions.forEach((action, index) => {
      console.log(`  ${index + 1}. ${action}`);
    });
    console.log("");
  }

  if (result.changedFiles.length > 0) {
    console.log("📄 改动文件列表:");
    result.changedFiles.forEach((file) => {
      const category = result.categories.find((item) => item.files.includes(file));
      const risk = category?.risk === "high" ? "🔴" : category?.risk === "medium" ? "🟡" : "🟢";
      console.log(`  ${risk} ${file}`);
    });
    console.log("");
  }

  return result;
}

if (require.main === module) {
  const result = main();
  if (result.healthScore.score < 50) {
    process.exit(2);
  } else if (result.healthScore.score < 70) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

module.exports = { main };
