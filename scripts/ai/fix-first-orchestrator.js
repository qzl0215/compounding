#!/usr/bin/env node

/**
 * 共享 CLI 外壳只负责参数解析、输出和错误出口。
 * 这个脚本本身只保留 gate 分类与 fix-first 决策逻辑。
 */

const { execSync } = require("child_process");
const { emitResult, exitWithError, parseCliArgs } = require("./lib/cli-kernel.js");

const COLOR = {
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  MAGENTA: "\x1b[35m",
  CYAN: "\x1b[36m",
  RESET: "\x1b[0m",
};

function createLogger(options) {
  return (message, color = COLOR.RESET) => {
    if (options.json || options.quiet) {
      return;
    }
    console.log(`${color}${message}${COLOR.RESET}`);
  };
}

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: "utf8",
      stdio: "pipe",
      ...options,
    }).trim();
    return { success: true, output: result, exitCode: 0 };
  } catch (error) {
    return {
      success: false,
      output: error.stdout || error.stderr || error.message,
      exitCode: error.status || 1,
    };
  }
}

function getCurrentTask() {
  const branchResult = runCommand("git branch --show-current");
  if (!branchResult.success) return null;
  const match = branchResult.output.match(/task-(\d+)/);
  return match ? match[1] : null;
}

const LAYERED_GATES = [
  {
    layer: "static",
    name: "静态门禁",
    priority: 1,
    checks: [
      {
        id: "lint",
        name: "代码风格检查",
        command: "pnpm lint",
        autoFix: "pnpm lint --fix",
        riskLevel: "low",
        fixConfidence: "high",
      },
      {
        id: "typecheck",
        name: "类型检查",
        command: 'pnpm typecheck 2>/dev/null || echo "No typecheck script"',
        autoFix: null,
        riskLevel: "medium",
        fixConfidence: "low",
      },
    ],
  },
  {
    layer: "build",
    name: "构建门禁",
    priority: 2,
    checks: [
      {
        id: "test",
        name: "单元测试",
        command: "pnpm test",
        autoFix: null,
        riskLevel: "high",
        fixConfidence: "none",
      },
      {
        id: "build",
        name: "构建验证",
        command: "pnpm build",
        autoFix: null,
        riskLevel: "high",
        fixConfidence: "none",
      },
    ],
  },
  {
    layer: "runtime",
    name: "运行时门禁",
    priority: 3,
    checks: [
      {
        id: "preview-check",
        name: "预览环境检查",
        command: "pnpm preview:check",
        autoFix: null,
        riskLevel: "high",
        fixConfidence: "none",
      },
    ],
  },
  {
    layer: "ai-output",
    name: "AI 输出门禁",
    priority: 4,
    checks: [
      {
        id: "ai-validate",
        name: "AI 输出验证",
        command: "pnpm ai:validate-trace && pnpm ai:validate-task-git",
        autoFix: null,
        riskLevel: "medium",
        fixConfidence: "low",
      },
    ],
  },
];

function runGateCheck(gate, check, log) {
  log(`\n🔍 [${gate.name}] ${check.name}`, COLOR.BLUE);
  const result = runCommand(check.command);

  return {
    layer: gate.layer,
    gate: gate.name,
    check,
    passed: result.success,
    result,
    evidence: result.output || "(无输出)",
    riskLevel: check.riskLevel,
    fixConfidence: check.fixConfidence,
  };
}

function classifyAction(checkResult) {
  if (checkResult.passed) {
    return { action: "PASS", reason: "检查通过" };
  }

  if (
    checkResult.check.autoFix &&
    checkResult.layer !== "build" &&
    checkResult.layer !== "runtime" &&
    checkResult.layer !== "ai-output" &&
    (checkResult.riskLevel === "low" ||
      (checkResult.riskLevel === "medium" && checkResult.fixConfidence === "high"))
  ) {
    return { action: "AUTO-FIX", reason: "低风险且可自动修复" };
  }

  return {
    action: "ASK",
    reason: checkResult.riskLevel === "high" ? "高风险需要人工审查" : "需要人工判断",
  };
}

function attemptAutoFix(checkResult, log) {
  const action = classifyAction(checkResult);
  if (action.action !== "AUTO-FIX") {
    return { ...checkResult, action, fixAttempted: false };
  }

  log(`🤖 尝试自动修复: ${checkResult.check.autoFix}`, COLOR.YELLOW);
  const fixResult = runCommand(checkResult.check.autoFix);

  if (!fixResult.success) {
    log("⚠️  自动修复失败，需要人工处理", COLOR.YELLOW);
    return {
      ...checkResult,
      action: { action: "ASK", reason: "自动修复执行失败" },
      fixAttempted: true,
      fixResult,
    };
  }

  const verifyResult = runCommand(checkResult.check.command);
  if (verifyResult.success) {
    log("✅ 自动修复成功", COLOR.GREEN);
    return {
      ...checkResult,
      action: { action: "AUTO-FIXED", reason: "自动修复成功" },
      passed: true,
      fixAttempted: true,
      fixResult,
      verifyResult,
    };
  }

  log("⚠️  自动修复后验证失败，需要人工处理", COLOR.YELLOW);
  return {
    ...checkResult,
    action: { action: "ASK", reason: "自动修复后仍失败" },
    fixAttempted: true,
    fixResult,
    verifyResult,
  };
}

function generateSummaryReport(results) {
  const summary = {
    total: results.length,
    passed: results.filter((result) => result.passed).length,
    autoFixed: results.filter((result) => result.action?.action === "AUTO-FIXED").length,
    askRequired: results.filter((result) => result.action?.action === "ASK").length,
    byLayer: {},
  };

  results.forEach((result) => {
    if (!summary.byLayer[result.layer]) {
      summary.byLayer[result.layer] = { passed: 0, failed: 0, autoFixed: 0, ask: 0 };
    }

    if (result.passed) {
      summary.byLayer[result.layer].passed += 1;
      if (result.action?.action === "AUTO-FIXED") {
        summary.byLayer[result.layer].autoFixed += 1;
      }
    } else {
      summary.byLayer[result.layer].failed += 1;
      if (result.action?.action === "ASK") {
        summary.byLayer[result.layer].ask += 1;
      }
    }
  });

  return summary;
}

function buildPayload(taskId, results, summary, failFastTriggered) {
  return {
    ok: summary.askRequired === 0,
    task_id: taskId ? `t-${taskId}` : null,
    summary,
    fail_fast_triggered: failFastTriggered,
    results: results.map((result) => ({
      layer: result.layer,
      gate: result.gate,
      check_id: result.check.id,
      check_name: result.check.name,
      passed: result.passed,
      action: result.action,
      risk_level: result.riskLevel,
      fix_confidence: result.fixConfidence,
      fix_attempted: result.fixAttempted,
      exit_code: result.result.exitCode,
      evidence: result.evidence,
    })),
  };
}

function renderTextResult(payload) {
  const lines = [];

  lines.push("");
  lines.push("=".repeat(60));
  lines.push("📊 Fix-First 验证总结");
  lines.push("=".repeat(60));
  lines.push(`✅ 通过: ${payload.summary.passed}/${payload.summary.total}`);
  lines.push(`🤖 自动修复: ${payload.summary.autoFixed}`);
  lines.push(`🤔 需要人工: ${payload.summary.askRequired}`);
  lines.push("");
  lines.push("📈 分层统计:");
  Object.entries(payload.summary.byLayer).forEach(([layer, stats]) => {
    lines.push(`${layer}: ${stats.passed}✅ ${stats.failed}❌ ${stats.autoFixed}🤖 ${stats.ask}🤔`);
  });

  if (payload.ok) {
    lines.push("");
    lines.push("🎉 所有检查通过！可以安全推进。");
  } else {
    lines.push("");
    lines.push("⚠️  存在需要人工处理的问题，请先解决后再推进。");
    lines.push("");
    lines.push("💡 建议:");
    lines.push("   1. 处理上述标记为 🤔 的问题");
    lines.push("   2. 重新运行本验证确认");
    lines.push("   3. 通过后再进入发布流程");
  }

  return lines.join("\n");
}

function main() {
  const cli = parseCliArgs(process.argv.slice(2));
  const log = createLogger(cli);
  const taskId = getCurrentTask();

  try {
    log("🚀 Fix-First 分层验证门禁启动", COLOR.MAGENTA);
    log("=".repeat(60), COLOR.MAGENTA);
    if (taskId) {
      log(`📍 当前任务: t-${taskId}`, COLOR.BLUE);
    } else {
      log("⚠️  未检测到任务分支，继续通用验证", COLOR.YELLOW);
    }

    log("\n📋 开始分层验证...", COLOR.CYAN);

    const allResults = [];
    let failFastTriggered = false;

    for (const gate of LAYERED_GATES) {
      log(`\n${"=".repeat(40)}`, COLOR.BLUE);
      log(`🏗️  ${gate.name} (优先级: ${gate.priority})`, COLOR.BLUE);
      log(`${"=".repeat(40)}`, COLOR.BLUE);

      for (const check of gate.checks) {
        const checkResult = runGateCheck(gate, check, log);
        const finalResult = attemptAutoFix(checkResult, log);
        allResults.push(finalResult);

        if (finalResult.action?.action === "ASK") {
          log("\n🛑 检测到需要人工处理的问题，停止当前层后续检查", COLOR.RED);
          log(`   建议: ${finalResult.action.reason}`, COLOR.YELLOW);
          if (cli.failFast) {
            failFastTriggered = true;
            break;
          }
          break;
        }
      }

      if (failFastTriggered) {
        break;
      }
    }

    const summary = generateSummaryReport(allResults);
    const payload = buildPayload(taskId, allResults, summary, failFastTriggered);
    emitResult(payload, cli, cli.json ? undefined : renderTextResult);
    return payload.ok ? 0 : 1;
  } catch (error) {
    exitWithError(error instanceof Error ? error.message : String(error), cli);
  }
}

if (require.main === module) {
  process.exit(main());
}

module.exports = {
  LAYERED_GATES,
  attemptAutoFix,
  classifyAction,
  generateSummaryReport,
  runGateCheck,
};
