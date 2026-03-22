/**
 * Unified Preamble for AI Collaboration Modes
 * 
 * Provides consistent context reset, task binding, question contracts, and session constraints
 * across all AI execution sessions.
 */

export interface UnifiedPreambleConfig {
  taskId: string;
  taskMode: 'plan' | 'execute' | 'qa-review';
  workMode: '战略澄清' | '方案评审' | '工程执行' | '质量验收' | '发布复盘';
  projectContext: {
    name: string;
    description: string;
    currentMilestone: string;
    sourceOfTruth: string[];
  };
}

export function generateUnifiedPreamble(config: UnifiedPreambleConfig): string {
  const { taskId, taskMode, workMode, projectContext } = config;
  
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

## 协作契约

- 默认回复结构与页面交付契约遵循 `AGENTS.md`
- 若任务方案尚未获用户确认，不直接进入实现
- 若任务、companion、release 主源冲突，先修主源再继续

## 会话约束

- 只读分析不强制同步
- 任何改动前先运行 python3 scripts/pre_mutation_check.py
- 发布动作只认 main 分支
- 默认推荐校验顺序：静态门禁 → 构建门禁 → 运行时门禁
- 每轮改动先生成 dev 预览，验收通过后才晋升到 main

## 当前工作模式要求

${getModeSpecificRequirements(taskMode, workMode)}

---

现在开始执行当前任务。`;
}

function getModeSpecificRequirements(taskMode: string, workMode: string): string {
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
  
  return modeRequirements[taskMode as keyof typeof modeRequirements] || '';
}

/**
 * Collaboration Mode Definitions
 */
export const COLLABORATION_MODES = {
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
} as const;

export type CollaborationMode = keyof typeof COLLABORATION_MODES;
