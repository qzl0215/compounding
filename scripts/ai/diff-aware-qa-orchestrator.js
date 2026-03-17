#!/usr/bin/env node

/**
 * Diff-aware QA Orchestrator
 * 
 * 基于改动范围自动生成测试关注点、证据落点与健康评分
 * 减少"全量回归式"低效验收，提供可解释的 QA 流程
 */

const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");

const root = process.cwd();

function git(args) {
  try {
    return childProcess.execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  } catch (error) {
    return "";
  }
}

function getChangedFiles() {
  const status = git(["status", "--short"]);
  if (status) {
    return status
      .split("\n")
      .map((line) => {
        const match = line.match(/^.. (.+)$/);
        if (!match) return null;
        const value = match[1].trim();
        return value.includes(" -> ") ? value.split(" -> ").at(-1)?.trim() : value;
      })
      .filter(Boolean);
  }

  try {
    const previous = git(["rev-parse", "HEAD^"]);
    return git(["diff", "--name-only", `${previous}..HEAD`])
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getDiffStats() {
  try {
    const stats = git(["diff", "--stat"]);
    const summary = stats.split("\n").pop();
    const match = summary?.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
    return match ? {
      files: parseInt(match[1]) || 0,
      insertions: parseInt(match[2]) || 0,
      deletions: parseInt(match[3]) || 0
    } : { files: 0, insertions: 0, deletions: 0 };
  } catch {
    return { files: 0, insertions: 0, deletions: 0 };
  }
}

function analyzeFileImpact(filePath) {
  const ext = path.extname(filePath);
  const basename = path.basename(filePath);
  
  const impact = {
    risk: 'low',
    category: 'unknown',
    testFocus: [],
    evidencePoints: []
  };

  // 文件类型分析
  if (filePath.includes('tasks/queue/')) {
    impact.category = 'task-management';
    impact.testFocus.push('任务状态流转', '分支绑定', '更新痕迹完整性');
    impact.evidencePoints.push('git branch --show-current', 'pnpm ai:validate-task-git');
  } else if (filePath.includes('scripts/ai/')) {
    impact.category = 'ai-scripts';
    impact.risk = 'medium';
    impact.testFocus.push('脚本可执行性', '依赖完整性', '错误处理');
    impact.evidencePoints.push('node scripts/ai/' + basename, 'pnpm run lint');
  } else if (filePath.includes('docs/')) {
    impact.category = 'documentation';
    impact.testFocus.push('文档一致性', '链接有效性', '版本对应');
    impact.evidencePoints.push('文档渲染检查', '内部链接验证');
  } else if (ext === '.json' && filePath.includes('package.json')) {
    impact.category = 'dependencies';
    impact.risk = 'medium';
    impact.testFocus.push('依赖安装', '脚本执行', '版本冲突');
    impact.evidencePoints.push('pnpm install', 'pnpm run build');
  } else if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    impact.category = 'source-code';
    impact.risk = 'high';
    impact.testFocus.push('类型检查', '单元测试', '运行时行为');
    impact.evidencePoints.push('pnpm run typecheck', 'pnpm run test', '构建产物验证');
  } else if (['.py'].includes(ext)) {
    impact.category = 'python-code';
    impact.risk = 'medium';
    impact.testFocus.push('语法检查', '导入测试', '运行时验证');
    impact.evidencePoints.push('python -m py_compile ' + filePath);
  }

  // 特殊文件模式
  if (basename.includes('test') || basename.includes('spec')) {
    impact.testFocus.push('测试本身可执行性');
    impact.evidencePoints.push('测试运行结果');
  }

  if (filePath.includes('config') || filePath.includes('.env')) {
    impact.risk = 'high';
    impact.testFocus.push('配置加载', '环境变量验证');
  }

  return impact;
}

function calculateHealthScore(files, impacts) {
  if (files.length === 0) return { score: 100, grade: 'A', reason: '无改动，无需测试' };

  const stats = getDiffStats();
  let baseScore = 100;
  const deductions = [];

  // 基于改动规模扣分
  if (stats.files > 10) {
    baseScore -= 20;
    deductions.push('改动文件过多 (' + stats.files + ')，建议分批验证');
  }
  if (stats.insertions + stats.deletions > 500) {
    baseScore -= 15;
    deductions.push('改动行数较多，建议重点测试');
  }

  // 基于风险等级扣分
  const highRiskCount = impacts.filter(i => i.risk === 'high').length;
  const mediumRiskCount = impacts.filter(i => i.risk === 'medium').length;

  if (highRiskCount > 0) {
    baseScore -= (highRiskCount * 25);
    deductions.push('存在高风险改动 (' + highRiskCount + ' 处)，需要全面测试');
  }
  if (mediumRiskCount > 0) {
    baseScore -= (mediumRiskCount * 10);
    deductions.push('存在中等风险改动 (' + mediumRiskCount + ' 处)');
  }

  // 确保分数在合理范围
  const finalScore = Math.max(0, Math.min(100, baseScore));
  
  let grade;
  if (finalScore >= 90) grade = 'A';
  else if (finalScore >= 80) grade = 'B';
  else if (finalScore >= 70) grade = 'C';
  else if (finalScore >= 60) grade = 'D';
  else grade = 'F';

  return {
    score: finalScore,
    grade: grade,
    reason: deductions.length > 0 ? deductions.join('; ') : '改动风险可控，按常规流程测试'
  };
}

function generateQASummary() {
  const changedFiles = getChangedFiles();
  
  if (changedFiles.length === 0) {
    return {
      summary: '无文件改动，无需 QA 验证',
      healthScore: { score: 100, grade: 'A', reason: '无改动' },
      testPlan: [],
      evidencePoints: [],
      nextActions: ['继续正常开发流程']
    };
  }

  const impacts = changedFiles.map(file => ({
    file,
    impact: analyzeFileImpact(file)
  }));

  const healthScore = calculateHealthScore(changedFiles, impacts.map(i => i.impact));
  
  // 生成测试计划
  const testPlan = [];
  const evidencePoints = [];
  const nextActions = [];

  // 按类别分组测试关注点
  const categories = {};
  impacts.forEach(({ file, impact }) => {
    if (!categories[impact.category]) {
      categories[impact.category] = {
        files: [],
        testFocus: new Set(),
        evidencePoints: new Set()
      };
    }
    categories[impact.category].files.push(file);
    impact.testFocus.forEach(focus => categories[impact.category].testFocus.add(focus));
    impact.evidencePoints.forEach(evidence => categories[impact.category].evidencePoints.add(evidence));
  });

  // 生成结构化测试计划
  Object.entries(categories).forEach(([category, data]) => {
    testPlan.push({
      category,
      files: data.files,
      testFocus: Array.from(data.testFocus),
      priority: data.files.some(f => impacts.find(i => i.file === f)?.impact.risk === 'high') ? 'high' : 'medium'
    });
  });

  // 收集证据落点
  impacts.forEach(({ impact }) => {
    impact.evidencePoints.forEach(point => evidencePoints.push(point));
  });

  // 生成下一步动作建议
  if (healthScore.score < 70) {
    nextActions.push('建议进行更全面的测试验证');
  }
  if (healthScore.score < 50) {
    nextActions.push('强烈建议暂停发布，先解决高风险问题');
  }
  if (changedFiles.length > 5) {
    nextActions.push('建议分批验证，降低风险');
  }
  
  // 基础动作
  nextActions.push('执行测试计划中的验证步骤');
  nextActions.push('收集证据落点，更新 QA 结论');

  return {
    summary: `本次改动涉及 ${changedFiles.length} 个文件，健康评分 ${healthScore.score}/100 (${healthScore.grade}级) - ${healthScore.reason}`,
    healthScore,
    testPlan,
    evidencePoints: [...new Set(evidencePoints)], // 去重
    nextActions,
    changedFiles,
    stats: getDiffStats()
  };
}

function main() {
  console.log("🔍 Diff-aware QA 分析开始...\n");
  
  const result = generateQASummary();
  
  // 输出结果
  console.log("📋 QA 分析摘要:");
  console.log("  " + result.summary);
  console.log("");
  
  console.log("💯 健康评分:");
  console.log(`  评分: ${result.healthScore.score}/100 (${result.healthScore.grade}级)`);
  console.log(`  原因: ${result.healthScore.reason}`);
  console.log("");
  
  if (result.testPlan.length > 0) {
    console.log("🧪 测试计划:");
    result.testPlan.forEach((plan, index) => {
      console.log(`  ${index + 1}. ${plan.category} (${plan.priority}优先级)`);
      console.log(`     文件: ${plan.files.length} 个`);
      console.log(`     关注点: ${plan.testFocus.join(', ')}`);
      console.log("");
    });
  }
  
  if (result.evidencePoints.length > 0) {
    console.log("📁 证据落点:");
    result.evidencePoints.forEach((point, index) => {
      console.log(`  ${index + 1}. ${point}`);
    });
    console.log("");
  }
  
  console.log("🎯 建议动作:");
  result.nextActions.forEach((action, index) => {
    console.log(`  ${index + 1}. ${action}`);
  });
  console.log("");
  
  if (result.changedFiles.length > 0) {
    console.log("📄 改动文件列表:");
    result.changedFiles.forEach((file, index) => {
      const impact = result.testPlan.find(p => p.files.includes(file));
      const risk = impact?.priority === 'high' ? '🔴' : impact?.priority === 'medium' ? '🟡' : '🟢';
      console.log(`  ${risk} ${file}`);
    });
    console.log("");
  }
  
  // 返回结构化结果供其他工具使用
  return result;
}

if (require.main === module) {
  const result = main();
  
  // 根据健康评分设置退出码
  if (result.healthScore.score < 50) {
    process.exit(2); // 高风险，需要人工干预
  } else if (result.healthScore.score < 70) {
    process.exit(1); // 中等风险，需要额外关注
  } else {
    process.exit(0); // 低风险，正常流程
  }
}

module.exports = { generateQASummary, analyzeFileImpact, calculateHealthScore };