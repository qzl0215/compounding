#!/usr/bin/env node

/**
 * Collaboration Mode Integration - Simple JS Version
 * 
 * Provides mode validation and unified preamble generation
 * without complex TypeScript dependencies.
 */

const fs = require('fs');
const path = require('path');

// Simple collaboration mode definitions
const COLLABORATION_MODES = {
  PLAN: {
    name: 'Plan',
    description: '战略澄清与方案规划',
    inputs: ['需求或问题', '当前 roadmap', '当前 operating-blueprint', '关键未解问题'],
    outputs: ['清晰里程碑定义', '更新后 roadmap', '更新后 operating-blueprint', '共商规划 task'],
    entryConditions: ['里程碑不清晰', '蓝图无法拆成关键子目标', '发布标准或成功定义模糊'],
    exitConditions: ['已形成可执行的里程碑、蓝图和规划 task']
  },
  
  EXECUTE: {
    name: 'Execute',
    description: '工程实现与代码落地',
    inputs: ['已确认的 task', '方案边界', '相关代码、模块、索引与记忆'],
    outputs: ['代码改动', '文档/记忆/索引回写', '可审查提交'],
    entryConditions: ['task 已明确', '方案边界和验收标准已确定'],
    exitConditions: ['结果达到可验收状态', '相关回写已完成']
  },
  
  QA_REVIEW: {
    name: 'QA-Review',
    description: '质量验收与风险评估',
    inputs: ['已实现结果', '验收标准', '设计要求', '运行时与测试结果'],
    outputs: ['通过/不通过结论', '风险说明', 'task 状态更新建议'],
    entryConditions: ['工程执行已完成', '结果准备交付或合并'],
    exitConditions: ['形成明确验收结论', '通过后才能进入发布复盘']
  }
};

function parseTaskFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const idMatch = content.match(/## 短编号\n+(.+)/);
  const statusMatch = content.match(/## 状态\n+(.+)/);
  const modeMatch = content.match(/## 当前模式\n+(.+)/);
  const branchMatch = content.match(/## 分支\n+(.+)/);
  const commitMatch = content.match(/## 最近提交\n+(.+)/);
  
  return {
    id: idMatch?.[1]?.trim() || '',
    shortId: idMatch?.[1]?.trim() || '',
    status: statusMatch?.[1]?.trim() || 'todo',
    mode: modeMatch?.[1]?.trim() || '方案评审',
    branch: branchMatch?.[1]?.trim() || '',
    lastCommit: commitMatch?.[1]?.trim()
  };
}

function inferCollaborationMode(taskStatus) {
  const modeMap = {
    '战略澄清': 'PLAN',
    '方案评审': 'PLAN',
    '工程执行': 'EXECUTE',
    '质量验收': 'QA_REVIEW',
    '发布复盘': 'QA_REVIEW'
  };
  
  return modeMap[taskStatus.mode] || 'PLAN';
}

function generateUnifiedPreamble(taskId, taskMode, workMode) {
  const projectContext = {
    name: 'Compounding AI Operating System',
    description: 'AI-Native Repo for sustainable AI collaboration',
    currentMilestone: 'gstack 高价值实践七项落地里程碑',
    sourceOfTruth: ['AGENTS.md', 'memory/project/roadmap.md', 'memory/project/operating-blueprint.md']
  };
  
  const modeRequirements = {
    'plan': `### Plan 模式要求
- 输入：需求、问题、当前 roadmap/blueprint
- 输出：清晰的里程碑定义、更新后的规划文档、共商规划 task
- 退出条件：已形成可执行的里程碑、蓝图和规划 task`,
    
    'execute': `### Execute 模式要求
- 输入：已确认的 task、方案边界、相关代码上下文
- 输出：代码改动、文档/记忆回写、可审查提交
- 退出条件：结果达到可验收状态、相关回写已完成`,
    
    'qa-review': `### QA-Review 模式要求
- 输入：已实现结果、验收标准、设计要求、运行时数据
- 输出：通过/不通过结论、风险说明、task 状态更新建议
- 退出条件：形成明确验收结论、通过后才能进入发布复盘`
  };
  
  return `## 会话上下文重置

- 当前任务：${taskId}
- 协作模式：${taskMode}
- 工作模式：${workMode}
- 项目：${projectContext.name}
- 里程碑：${projectContext.currentMilestone}

## 任务绑定契约

1. 任何 repo-tracked 改动必须绑定并更新当前任务
2. 任务状态、最近提交与是否并入 main 必须可追踪
3. 巨型 util/helper/common 不允许继续扩张
4. 经验先写入 memory/experience/*，稳定后再升格

## 提问契约

- 默认回复格式：已完成清单 → 证据与边界 → 风险与待决策 → 下一步
- 交付 dev/production 页面时，必须提供：环境说明 + 页面链接 + 验收方式
- 进入新任务时，必须先提供：中文任务摘要 + 可执行方案 + 待用户确认

## 证据边界

- 本地离线证据：代码改动、测试结果、构建产物
- 服务器真实证据：运行时状态、API 响应、性能指标
- 当前结论适用边界：以任务范围和验收标准为准

## 会话约束

- 只读分析不强制同步
- 任何改动前先运行 python3 scripts/pre_mutation_check.py
- 发布动作只认 main 分支
- 默认推荐校验顺序：静态门禁 → 构建门禁 → 运行时门禁
- 每轮改动先生成 dev 预览，验收通过后才晋升到 main

${modeRequirements[taskMode] || ''}

---

现在开始执行当前任务。`;
}

function validateTask(taskStatus) {
  const issues = [];
  
  if (!taskStatus.id) {
    issues.push('任务 ID 缺失');
  }
  
  if (!taskStatus.branch) {
    issues.push('任务分支未绑定');
  }
  
  const collaborationMode = inferCollaborationMode(taskStatus);
  
  switch (collaborationMode) {
    case 'PLAN':
      if (taskStatus.status !== 'doing' && taskStatus.status !== 'todo') {
        issues.push('规划模式要求任务状态为 todo 或 doing');
      }
      break;
      
    case 'EXECUTE':
      if (taskStatus.status !== 'doing') {
        issues.push('执行模式要求任务状态为 doing');
      }
      if (!taskStatus.lastCommit) {
        issues.push('执行模式需要最近提交记录');
      }
      break;
      
    case 'QA_REVIEW':
      if (taskStatus.status !== 'doing') {
        issues.push('验收模式要求任务状态为 doing');
      }
      break;
  }
  
  return {
    valid: issues.length === 0,
    issues,
    currentMode: collaborationMode
  };
}

function main() {
  const taskFilePath = process.argv[2];
  const action = process.argv[3];
  
  if (!taskFilePath || !action) {
    console.error('Usage: node collaboration-mode-integration.js <task-file> <action> [options]');
    console.error('Actions: validate, preamble, mode-info');
    process.exit(1);
  }
  
  try {
    const task = parseTaskFile(taskFilePath);
    
    switch (action) {
      case 'validate':
        const validation = validateTask(task);
        console.log(JSON.stringify(validation, null, 2));
        break;
        
      case 'preamble':
        const collaborationMode = inferCollaborationMode(task);
        const preamble = generateUnifiedPreamble(task.shortId, collaborationMode.toLowerCase(), task.mode);
        console.log(preamble);
        break;
        
      case 'mode-info':
        const currentMode = inferCollaborationMode(task);
        const modeDetails = COLLABORATION_MODES[currentMode];
        console.log(JSON.stringify({
          currentMode,
          details: modeDetails,
          taskStatus: task
        }, null, 2));
        break;
        
      default:
        console.error(`Unknown action: ${action}`);
        process.exit(1);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}