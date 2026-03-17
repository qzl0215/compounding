#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLOR = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m', 
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
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
    return { success: true, output: result };
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

function getTaskMode(taskId) {
  if (!taskId) return null;
  
  try {
    const taskFile = path.join(__dirname, '../../tasks/queue', `task-${taskId.padStart(3, '0')}-*.md`);
    const files = fs.readdirSync(path.dirname(taskFile)).filter(f => f.includes(`task-${taskId.padStart(3, '0')}`));
    
    if (files.length === 0) return null;
    
    const content = fs.readFileSync(path.join(path.dirname(taskFile), files[0]), 'utf8');
    const modeMatch = content.match(/当前模式\s*\n\s*(\S+)/);
    return modeMatch ? modeMatch[1] : null;
  } catch {
    return null;
  }
}

const CHECKLIST = [
  {
    id: 'worktree-clean',
    name: '工作区干净',
    command: 'git status --porcelain',
    expectEmpty: true,
    autoFix: null, // Can't auto-fix - user must commit/stash
    askMessage: '请先提交、暂存或丢弃本地改动后再继续。'
  },
  {
    id: 'task-valid',
    name: '任务绑定有效',
    command: 'pnpm ai:validate-task-git',
    expectSuccess: true,
    autoFix: null,
    askMessage: '任务绑定存在问题，请检查任务状态和分支绑定。'
  },
  {
    id: 'trace-valid',
    name: '变更追踪有效',
    command: 'pnpm ai:validate-trace',
    expectSuccess: true,
    autoFix: null,
    askMessage: '变更追踪存在问题，请确保改动与任务绑定一致。'
  },
  {
    id: 'static-check',
    name: '静态检查通过',
    command: 'pnpm validate:static',
    expectSuccess: true,
    autoFix: 'pnpm lint --fix',
    askMessage: '静态检查失败，需要手动修复。'
  },
  {
    id: 'build-check',
    name: '构建检查通过',
    command: 'pnpm validate:build',
    expectSuccess: true,
    autoFix: null,
    askMessage: '构建检查失败，需要手动修复构建问题。'
  }
];

function runCheck(check) {
  log(`\n📋 检查: ${check.name}`, COLOR.BLUE);
  
  const result = runCommand(check.command);
  
  if (check.expectEmpty !== undefined) {
    const isEmpty = result.success && result.output === '';
    return {
      ...check,
      passed: check.expectEmpty ? isEmpty : !isEmpty,
      result,
      evidence: result.output || '(空)'
    };
  }
  
  return {
    ...check,
    passed: result.success === check.expectSuccess,
    result,
    evidence: result.output || '(无输出)'
  };
}

function suggestAction(check) {
  if (check.passed) return null;
  
  if (check.autoFix) {
    log(`🤖 尝试自动修复: ${check.autoFix}`, COLOR.YELLOW);
    const fixResult = runCommand(check.autoFix);
    
    if (fixResult.success) {
      log('✅ 自动修复成功，重新检查...', COLOR.GREEN);
      const recheck = runCheck(check);
      if (recheck.passed) {
        log('✅ 重新检查通过', COLOR.GREEN);
        return recheck;
      }
    }
    log('⚠️  自动修复失败，需要手动处理', COLOR.YELLOW);
  }
  
  return { ...check, action: 'ASK', message: check.askMessage };
}

function main() {
  log('🚀 Pre-Landing Checklist 启动', COLOR.BLUE);
  
  const taskId = getCurrentTask();
  const taskMode = taskId ? getTaskMode(taskId) : null;
  
  log(`📍 当前任务: ${taskId ? `t-${taskId}` : '未检测到'}`, COLOR.BLUE);
  if (taskMode) log(`🎯 任务模式: ${taskMode}`, COLOR.BLUE);
  
  const results = CHECKLIST.map(runCheck);
  const failedChecks = results.filter(r => !r.passed);
  
  log('\n' + '='.repeat(50), COLOR.BLUE);
  log('📊 检查结果汇总', COLOR.BLUE);
  log('='.repeat(50), COLOR.BLUE);
  
  results.forEach(result => {
    const status = result.passed ? '✅ 通过' : '❌ 失败';
    const color = result.passed ? COLOR.GREEN : COLOR.RED;
    log(`${status} ${result.name}`, color);
  });
  
  if (failedChecks.length === 0) {
    log('\n🎉 所有检查通过！可以安全落地。', COLOR.GREEN);
    return 0;
  }
  
  log(`\n⚠️  发现 ${failedChecks.length} 项检查失败`, COLOR.YELLOW);
  
  const actions = failedChecks.map(suggestAction);
  const askActions = actions.filter(a => a && a.action === 'ASK');
  
  if (askActions.length > 0) {
    log('\n🤔 需要手动处理的问题:', COLOR.YELLOW);
    askActions.forEach(action => {
      log(`  • ${action.message}`, COLOR.RED);
    });
  }
  
  const autoFixed = actions.filter(a => a && a.passed).length;
  const remaining = failedChecks.length - autoFixed;
  
  if (remaining === 0) {
    log('\n✅ 自动修复完成！重新运行检查确认。', COLOR.GREEN);
    return 0;
  }
  
  log(`\n📋 建议下一步:`, COLOR.BLUE);
  log(`  1. 处理上述 ${remaining} 个手动问题`, COLOR.YELLOW);
  log(`  2. 重新运行本检查确认`, COLOR.YELLOW);
  log(`  3. 通过后再进入落地流程`, COLOR.YELLOW);
  
  return 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { runCheck, suggestAction, CHECKLIST };