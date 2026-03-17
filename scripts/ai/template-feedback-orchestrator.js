#!/usr/bin/env node

/**
 * Template Generation and Feedback Loop Orchestrator
 * 
 * 建立"模板生成防漂移 + 工具体验反馈闭环"机制
 * 让关键资产一致性和经验沉淀可持续运行
 */

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

// 任务文件模板定义
const TASK_TEMPLATE = `# 任务 {task_id}

## 短编号

{short_id}

## 目标

{objective}

## 为什么

{why}

## 范围

{scope}

## 范围外

{out_of_scope}

## 约束

{constraints}

## 关联模块

{related_modules}

## 当前模式

{current_mode}

## 分支

{branch_name}

## 最近提交

{recent_commit}

## 交付收益

{benefits}

## 交付风险

{risks}

## 计划

{plan}

## 发布说明

{release_notes}

## 验收标准

{acceptance_criteria}

## 风险

{implementation_risks}

## 状态

todo

## 更新痕迹

- 记忆：\`memory/project/current-state.md\`
- 索引：\`no change: 本轮仅新增任务编排\`
- 路线图：\`memory/project/roadmap.md\`
- 文档：\`{task_path}\`

## 一句复盘

未复盘
`;

// 经验记录模板定义
const EXPERIENCE_TEMPLATE = `---
title: {title}
doc_role: memory
update_mode: append_only
owner_role: Auditor
status: active
last_reviewed_at: {date}
source_of_truth: AGENTS.md
related_docs:
  - {related_docs}
---
<!-- BEGIN MANAGED BLOCK: CANONAGED_CONTENT -->
# {title}

## 背景

{background}

## 决策

{decision}

## 为什么

{reasoning}

## 影响

{impact}

## 复用

{reuse_guidance}

## 升格候选

- {promotion_criteria}
<!-- END MANAGED BLOCK: CANONAGED_CONTENT -->
`;

// 工具体验反馈模板
const TOOL_FEEDBACK_TEMPLATE = `---
timestamp: {timestamp}
context: {context}
user_role: {user_role}
tool_name: {tool_name}
---

## 体验描述

{experience_description}

## 摩擦点

{pain_points}

## 改进建议

{improvement_suggestions}

## 优先级

{priority}

## 可复现性

{reproducibility}

## 相关经验

{related_experience}
`;

class TemplateGenerator {
  constructor() {
    this.templates = {
      task: TASK_TEMPLATE,
      experience: EXPERIENCE_TEMPLATE,
      tool_feedback: TOOL_FEEDBACK_TEMPLATE
    };
  }

  generateTaskFile(params) {
    const defaults = {
      task_id: 'task-XXX',
      short_id: 't-XXX',
      objective: '待补充',
      why: '待补充',
      scope: '待补充',
      out_of_scope: '待补充',
      constraints: '待补充',
      related_modules: '待补充',
      current_mode: '方案评审',
      branch_name: 'codex/{task_id}',
      recent_commit: 'auto: branch HEAD',
      benefits: '待补充',
      risks: '待补充',
      plan: '1. 待补充\n2. 待补充\n3. 待补充',
      release_notes: '待补充',
      acceptance_criteria: '待补充',
      implementation_risks: '待补充',
      task_path: 'tasks/queue/{task_id}.md'
    };

    const merged = { ...defaults, ...params };
    return this.fillTemplate('task', merged);
  }

  generateExperienceRecord(params) {
    const defaults = {
      title: '待补充',
      date: new Date().toISOString().split('T')[0],
      related_docs: '待补充',
      background: '待补充',
      decision: '待补充',
      reasoning: '待补充',
      impact: '待补充',
      reuse_guidance: '待补充',
      promotion_criteria: '重复出现 2 次以上且无明显例外的经验，才能候选升格'
    };

    const merged = { ...defaults, ...params };
    return this.fillTemplate('experience', merged);
  }

  generateToolFeedback(params) {
    const defaults = {
      timestamp: new Date().toISOString(),
      context: '任务执行过程中',
      user_role: '开发者',
      tool_name: '待补充',
      experience_description: '待补充',
      pain_points: '待补充',
      improvement_suggestions: '待补充',
      priority: 'medium',
      reproducibility: '可复现',
      related_experience: '待补充'
    };

    const merged = { ...defaults, ...params };
    return this.fillTemplate('tool_feedback', merged);
  }

  fillTemplate(templateName, params) {
    let template = this.templates[templateName];
    if (!template) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    Object.entries(params).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{${key}\\}`, 'g');
      template = template.replace(placeholder, value);
    });

    return template;
  }

  validateGeneratedContent(content, templateName) {
    const issues = [];
    
    // 检查是否有未填充的占位符
    const placeholderRegex = /\\{[^}]+\\}/g;
    const placeholders = content.match(placeholderRegex) || [];
    if (placeholders.length > 0) {
      issues.push(`发现未填充占位符: ${placeholders.join(', ')}`);
    }

    // 检查是否有"待补充"内容
    if (content.includes('待补充')) {
      issues.push('发现"待补充"内容，需要完善');
    }

    // 模板特定的验证
    if (templateName === 'task') {
      const requiredSections = ['目标', '为什么', '范围', '计划', '验收标准'];
      const missingSections = requiredSections.filter(section => 
        !content.includes(`## ${section}`) && !content.includes(`## ${section}（已填写）`)
      );
      if (missingSections.length > 0) {
        issues.push(`缺失必要章节: ${missingSections.join(', ')}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

class FeedbackLoopManager {
  constructor() {
    this.experienceDir = path.join(root, 'memory', 'experience');
    this.feedbackDir = path.join(root, 'memory', 'feedback');
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.feedbackDir)) {
      fs.mkdirSync(this.feedbackDir, { recursive: true });
    }
  }

  recordToolFeedback(feedbackData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `feedback-${feedbackData.tool_name}-${timestamp}.md`;
    const filepath = path.join(this.feedbackDir, filename);

    const generator = new TemplateGenerator();
    const content = generator.generateToolFeedback(feedbackData);
    
    fs.writeFileSync(filepath, content, 'utf8');
    
    console.log(`✅ 工具体验反馈已记录: ${filename}`);
    return filepath;
  }

  analyzeFeedbackTrends() {
    if (!fs.existsSync(this.feedbackDir)) {
      return { summary: '暂无反馈数据', trends: [] };
    }

    const files = fs.readdirSync(this.feedbackDir)
      .filter(f => f.startsWith('feedback-') && f.endsWith('.md'))
      .sort()
      .reverse(); // 最新的在前

    const feedbacks = files.slice(0, 10).map(file => { // 最近10条
      const content = fs.readFileSync(path.join(this.feedbackDir, file), 'utf8');
      return this.parseFeedbackContent(content);
    });

    const toolStats = {};
    const painPointFreq = {};
    const priorityDist = { high: 0, medium: 0, low: 0 };

    feedbacks.forEach(feedback => {
      // 工具统计
      if (!toolStats[feedback.tool_name]) {
        toolStats[feedback.tool_name] = { count: 0, avgPriority: 0 };
      }
      toolStats[feedback.tool_name].count++;

      // 痛点频率
      feedback.pain_points.split('\n').forEach(point => {
        if (point.trim()) {
          painPointFreq[point.trim()] = (painPointFreq[point.trim()] || 0) + 1;
        }
      });

      // 优先级分布
      priorityDist[feedback.priority]++;
    });

    return {
      summary: `分析 ${feedbacks.length} 条反馈，涉及 ${Object.keys(toolStats).length} 个工具`,
      trends: {
        topPainPoints: Object.entries(painPointFreq)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([point, count]) => ({ point, count })),
        toolUsage: Object.entries(toolStats).map(([tool, stats]) => ({
          tool,
          feedbackCount: stats.count
        })),
        priorityDistribution: priorityDist
      }
    };
  }

  parseFeedbackContent(content) {
    const lines = content.split('\n');
    const feedback = {};
    
    lines.forEach(line => {
      if (line.startsWith('timestamp:')) {
        feedback.timestamp = line.replace('timestamp: ', '').trim();
      } else if (line.startsWith('tool_name:')) {
        feedback.tool_name = line.replace('tool_name: ', '').trim();
      } else if (line.startsWith('priority:')) {
        feedback.priority = line.replace('priority: ', '').trim();
      } else if (line.startsWith('## 摩擦点')) {
        const startIdx = lines.indexOf(line) + 1;
        const endIdx = lines.findIndex((l, i) => i > startIdx && l.startsWith('##'));
        feedback.pain_points = lines.slice(startIdx, endIdx === -1 ? undefined : endIdx).join('\n');
      }
    });

    return feedback;
  }

  promoteExperienceToRule(experiencePath) {
    // 读取经验记录
    const content = fs.readFileSync(experiencePath, 'utf8');
    
    // 提取关键信息（简化版）
    const titleMatch = content.match(/title: (.+)/);
    const decisionMatch = content.match(/## 决策[\s\S]*?\n\n(.*?)\n\n/);
    
    if (!titleMatch || !decisionMatch) {
      throw new Error('无法提取经验记录的关键信息');
    }

    const experience = {
      title: titleMatch[1],
      decision: decisionMatch[1],
      path: experiencePath
    };

    console.log(`📝 经验升格候选: ${experience.title}`);
    console.log(`   决策: ${experience.decision}`);
    
    return experience;
  }
}

function main() {
  const generator = new TemplateGenerator();
  const feedbackManager = new FeedbackLoopManager();

  const command = process.argv[2];
  
  switch (command) {
    case 'generate-task':
      return generateTaskTemplate(generator);
    
    case 'generate-experience':
      return generateExperienceTemplate(generator);
    
    case 'record-feedback':
      return recordToolFeedback(feedbackManager);
    
    case 'analyze-feedback':
      return analyzeFeedbackTrends(feedbackManager);
    
    case 'validate-template':
      return validateTemplateContent(generator);
    
    default:
      console.log(`
模板生成与反馈闭环编排器

用法:
  node scripts/ai/template-feedback-orchestrator.js generate-task          - 生成任务文件模板
  node scripts/ai/template-feedback-orchestrator.js generate-experience   - 生成经验记录模板
  node scripts/ai/template-feedback-orchestrator.js record-feedback       - 记录工具体验反馈
  node scripts/ai/template-feedback-orchestrator.js analyze-feedback      - 分析反馈趋势
  node scripts/ai/template-feedback-orchestrator.js validate-template     - 验证模板内容

功能:
  - 模板生成: 标准化任务文件、经验记录、工具反馈的格式
  - 一致性校验: 验证生成内容是否符合模板要求
  - 反馈闭环: 收集、分析工具使用体验，支持经验升格
  - 趋势分析: 识别高频痛点，指导改进优先级
`);
  }
}

function generateTaskTemplate(generator) {
  const params = {
    task_id: 'task-XXX',
    short_id: 't-XXX',
    objective: '建立模板生成与反馈闭环机制，防止关键资产漂移',
    why: '规则与执行文档最容易在迭代中漂移，需要标准化模板和反馈机制',
    scope: '- 创建任务文件、经验记录、工具反馈的标准化模板\n- 实现模板内容一致性校验\n- 建立工具体验反馈收集与分析机制',
    related_modules: '- `docs/ASSET_MAINTENANCE.md`\n- `docs/AI_OPERATING_MODEL.md`\n- `memory/experience/*`\n- `memory/feedback/*`',
    plan: '1. 定义标准化模板格式\n2. 实现模板生成与验证功能\n3. 建立反馈收集与分析机制\n4. 在真实任务中验证闭环效果',
    acceptance_criteria: '- 模板生成器可创建标准化文档\n- 一致性校验能发现格式问题\n- 反馈机制能收集和分析体验数据\n- 经验升格路径清晰可执行'
  };

  const content = generator.generateTaskFile(params);
  const validation = generator.validateGeneratedContent(content, 'task');

  console.log('📋 生成的任务文件模板:');
  console.log(content);
  console.log('\n🔍 验证结果:');
  console.log(validation.valid ? '✅ 模板有效' : '❌ 发现问题:');
  validation.issues.forEach(issue => console.log(`  - ${issue}`));
}

function generateExperienceTemplate(generator) {
  const params = {
    title: '模板生成减少文档漂移',
    background: '文档资产在迭代中容易失去一致性，影响团队协作效率',
    decision: '采用标准化模板生成关键文档，确保格式和内容一致性',
    reasoning: '模板化能强制遵循最佳实践，减少人为疏忽导致的质量问题',
    impact: '提高文档质量，降低维护成本，增强团队协作效率',
    reuse_guidance: '适用于所有需要标准化的文档资产，优先在高频修改场景使用'
  };

  const content = generator.generateExperienceRecord(params);
  console.log('📋 生成的经验记录模板:');
  console.log(content);
}

function recordToolFeedback(feedbackManager) {
  const feedbackData = {
    tool_name: 'diff-aware-qa-orchestrator',
    context: 't-023 任务实施过程中',
    user_role: 'AI Assistant',
    experience_description: 'diff-aware QA 编排器能有效分析改动影响面，但需要手动指定参数',
    pain_points: '需要手动运行，不能自动集成到现有流程\n健康评分算法需要更多调优',
    improvement_suggestions: '集成到 pre-landing 检查流程\n提供配置文件自定义评分权重',
    priority: 'medium',
    reproducibility: '可复现',
    related_experience: 'exp-002-memory-before-promotion'
  };

  const filepath = feedbackManager.recordToolFeedback(feedbackData);
  console.log(`✅ 反馈已记录到: ${filepath}`);
}

function analyzeFeedbackTrends(feedbackManager) {
  const analysis = feedbackManager.analyzeFeedbackTrends();
  
  console.log('📊 反馈趋势分析:');
  console.log(analysis.summary);
  
  if (analysis.trends) {
    console.log('\n🔝 高频痛点:');
    analysis.trends.topPainPoints.forEach(item => {
      console.log(`  - ${item.point} (${item.count} 次)`);
    });
    
    console.log('\n🛠️ 工具使用情况:');
    analysis.trends.toolUsage.forEach(tool => {
      console.log(`  - ${tool.tool}: ${tool.feedbackCount} 条反馈`);
    });
    
    console.log('\n📈 优先级分布:');
    Object.entries(analysis.trends.priorityDistribution).forEach(([priority, count]) => {
      console.log(`  - ${priority}: ${count}`);
    });
  }
}

function validateTemplateContent(generator) {
  const validContent = generator.generateTaskFile({
    task_id: 'task-validate-test',
    short_id: 't-validate',
    objective: '验证模板内容',
    why: '确保模板生成质量',
    scope: '测试模板验证功能',
    plan: '1. 生成模板\n2. 验证内容\n3. 输出结果',
    acceptance_criteria: '模板验证能发现问题'
  });

  const invalidContent = validContent.replace('## 目标', '## 目标（已填写）')
    .replace('验证模板内容', '待补充'); // 故意制造问题

  console.log('🔍 模板验证测试:');
  
  console.log('\n✅ 有效模板验证:');
  const validResult = generator.validateGeneratedContent(validContent, 'task');
  console.log(validResult.valid ? '通过验证' : '发现问题: ' + validResult.issues.join(', '));
  
  console.log('\n❌ 无效模板验证:');
  const invalidResult = generator.validateGeneratedContent(invalidContent, 'task');
  console.log(invalidResult.valid ? '意外通过' : '正确发现问题: ' + invalidResult.issues.join(', '));
}

if (require.main === module) {
  main();
}

module.exports = { TemplateGenerator, FeedbackLoopManager };