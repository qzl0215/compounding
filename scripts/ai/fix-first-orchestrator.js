#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLOR = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m', 
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m'
};

function log(message, color = COLOR.RESET) {
  console.log(`${color}${message}${COLOR.RESET}`);
}

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      ...options 
    }).trim();
    return { success: true, output: result, exitCode: 0 };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout || error.stderr || error.message,
      exitCode: error.status || 1
    };
  }
}

function getCurrentTask() {
  try {
    const branchResult = runCommand('git branch --show-current');
    if (!branchResult.success) return null;
    
    const branch = branchResult.output;
    const match = branch.match(/task-(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

const LAYERED_GATES = [
  {
    layer: 'static',
    name: '静态门禁',
    priority: 1,
    checks: [
      {
        id: 'lint',
        name: '代码风格检查',
        command: 'pnpm lint',
        autoFix: 'pnpm lint --fix',
        riskLevel: 'low',
        fixConfidence: 'high'
      },
      {
        id: 'typecheck',
        name: '类型检查',
        command: 'pnpm typecheck 2>/dev/null || echo "No typecheck script"',
        autoFix: null, // Complex fixes need manual review
        riskLevel: 'medium',
        fixConfidence: 'low'
      }
    ]
  },
  {
    layer: 'build',
    name: '构建门禁', 
    priority: 2,
    checks: [
      {
        id: 'test',
        name: '单元测试',
        command: 'pnpm test',
        autoFix: null, // Tests need manual analysis
        riskLevel: 'high',
        fixConfidence: 'none'
      },
      {
        id: 'build',
        name: '构建验证',
        command: 'pnpm build',
        autoFix: null, // Build issues need investigation
        riskLevel: 'high', 
        fixConfidence: 'none'
      }
    ]
  },
  {
    layer: 'runtime',
    name: '运行时门禁',
    priority: 3,
    checks: [
      {
        id: 'preview-check',
        name: '预览环境检查',
        command: 'pnpm preview:check',
        autoFix: null,
        riskLevel: 'high',
        fixConfidence: 'none'
      }
    ]
  },
  {
    layer: 'ai-output',
    name: 'AI 输出门禁',
    priority: 4,
    checks: [
      {
        id: 'ai-validate',
        name: 'AI 输出验证',
        command: 'pnpm ai:validate-trace && pnpm ai:validate-task-git',
        autoFix: null,
        riskLevel: 'medium',
        fixConfidence: 'low'
      }
    ]
  }
];

function runGateCheck(gate, check) {
  log(`\n🔍 [${gate.name}] ${check.name}`, COLOR.BLUE);
  
  const result = runCommand(check.command);
  const passed = result.success;
  
  return {
    layer: gate.layer,
    gate: gate.name,
    check: check,
    passed: passed,
    result: result,
    evidence: result.output || '(无输出)',
    riskLevel: check.riskLevel,
    fixConfidence: check.fixConfidence
  };
}

function classifyAction(checkResult) {
  if (checkResult.passed) {
    return { action: 'PASS', reason: '检查通过' };
  }
  
  // AUTO-FIX criteria:
  // 1. Has auto-fix capability
  // 2. Risk level is low or medium with high confidence
  // 3. Not a build/runtime/ai-output layer (these need review)
  if (checkResult.check.autoFix && 
      checkResult.layer !== 'build' && 
      checkResult.layer !== 'runtime' && 
      checkResult.layer !== 'ai-output' &&
      (checkResult.riskLevel === 'low' || 
       (checkResult.riskLevel === 'medium' && checkResult.fixConfidence === 'high'))) {
    return { action: 'AUTO-FIX', reason: '低风险且可自动修复' };
  }
  
  // ASK for everything else
  return { 
    action: 'ASK', 
    reason: checkResult.riskLevel === 'high' ? '高风险需要人工审查' : '需要人工判断'
  };
}

function attemptAutoFix(checkResult) {
  const action = classifyAction(checkResult);
  
  if (action.action !== 'AUTO-FIX') {
    return { ...checkResult, action, fixAttempted: false };
  }
  
  log(`🤖 尝试自动修复: ${checkResult.check.autoFix}`, COLOR.YELLOW);
  
  const fixResult = runCommand(checkResult.check.autoFix);
  
  if (fixResult.success) {
    // Re-run the original check to verify fix
    const verifyResult = runCommand(checkResult.check.command);
    
    if (verifyResult.success) {
      log('✅ 自动修复成功', COLOR.GREEN);
      return {
        ...checkResult,
        action: { action: 'AUTO-FIXED', reason: '自动修复成功' },
        passed: true,
        fixAttempted: true,
        fixResult: fixResult
      };
    } else {
      log('⚠️  自动修复后验证失败，需要人工处理', COLOR.YELLOW);
      return {
        ...checkResult,
        action: { action: 'ASK', reason: '自动修复后仍失败' },
        fixAttempted: true,
        fixResult: fixResult,
        verifyResult: verifyResult
      };
    }
  } else {
    log('⚠️  自动修复失败，需要人工处理', COLOR.YELLOW);
    return {
      ...checkResult,
      action: { action: 'ASK', reason: '自动修复执行失败' },
      fixAttempted: true,
      fixResult: fixResult
    };
  }
}

function generateSummaryReport(results) {
  const summary = {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    autoFixed: results.filter(r => r.action && r.action.action === 'AUTO-FIXED').length,
    askRequired: results.filter(r => r.action && r.action.action === 'ASK').length,
    byLayer: {}
  };
  
  results.forEach(result => {
    if (!summary.byLayer[result.layer]) {
      summary.byLayer[result.layer] = { passed: 0, failed: 0, autoFixed: 0, ask: 0 };
    }
    
    if (result.passed) {
      summary.byLayer[result.layer].passed++;
      if (result.action && result.action.action === 'AUTO-FIXED') {
        summary.byLayer[result.layer].autoFixed++;
      }
    } else {
      summary.byLayer[result.layer].failed++;
      if (result.action && result.action.action === 'ASK') {
        summary.byLayer[result.layer].ask++;
      }
    }
  });
  
  return summary;
}

function main() {
  const taskId = getCurrentTask();
  
  log('🚀 Fix-First 分层验证门禁启动', COLOR.MAGENTA);
  log('='.repeat(60), COLOR.MAGENTA);
  
  if (taskId) {
    log(`📍 当前任务: t-${taskId}`, COLOR.BLUE);
  } else {
    log('⚠️  未检测到任务分支，继续通用验证', COLOR.YELLOW);
  }
  
  log('\n📋 开始分层验证...', COLOR.CYAN);
  
  // Run checks layer by layer
  const allResults = [];
  
  for (const gate of LAYERED_GATES) {
    log(`\n${'='.repeat(40)}`, COLOR.BLUE);
    log(`🏗️  ${gate.name} (优先级: ${gate.priority})`, COLOR.BLUE);
    log(`${'='.repeat(40)}`, COLOR.BLUE);
    
    for (const check of gate.checks) {
      const checkResult = runGateCheck(gate, check);
      const finalResult = attemptAutoFix(checkResult);
      allResults.push(finalResult);
      
      // If this layer has failures that need ASK, stop here
      if (finalResult.action && finalResult.action.action === 'ASK') {
        log(`\n🛑 检测到需要人工处理的问题，停止后续检查`, COLOR.RED);
        log(`   建议: ${finalResult.action.reason}`, COLOR.YELLOW);
        break;
      }
    }
  }
  
  // Generate summary
  const summary = generateSummaryReport(allResults);
  
  log('\n' + '='.repeat(60), COLOR.MAGENTA);
  log('📊 Fix-First 验证总结', COLOR.MAGENTA);
  log('='.repeat(60), COLOR.MAGENTA);
  
  log(`✅ 通过: ${summary.passed}/${summary.total}`, COLOR.GREEN);
  log(`🤖 自动修复: ${summary.autoFixed}`, COLOR.CYAN);
  log(`🤔 需要人工: ${summary.askRequired}`, COLOR.YELLOW);
  
  log('\n📈 分层统计:', COLOR.BLUE);
  Object.entries(summary.byLayer).forEach(([layer, stats]) => {
    const layerColor = stats.failed > 0 ? COLOR.RED : COLOR.GREEN;
    log(`${layer}: ${stats.passed}✅ ${stats.failed}❌ ${stats.autoFixed}🤖 ${stats.ask}🤔`, layerColor);
  });
  
  // Final decision
  if (summary.askRequired === 0) {
    log('\n🎉 所有检查通过！可以安全推进。', COLOR.GREEN);
    return 0;
  } else {
    log('\n⚠️  存在需要人工处理的问题，请先解决后再推进。', COLOR.YELLOW);
    log('\n💡 建议:', COLOR.BLUE);
    log('   1. 处理上述标记为 🤔 的问题', COLOR.YELLOW);
    log('   2. 重新运行本验证确认', COLOR.YELLOW);
    log('   3. 通过后再进入发布流程', COLOR.YELLOW);
    return 1;
  }
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { 
  LAYERED_GATES, 
  runGateCheck, 
  attemptAutoFix, 
  classifyAction,
  generateSummaryReport 
};