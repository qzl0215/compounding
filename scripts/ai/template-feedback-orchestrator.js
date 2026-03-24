#!/usr/bin/env node

/**
 * 共享 CLI 外壳只负责参数解析、输出和错误出口。
 * 这个脚本本身只保留模板反馈流程的业务逻辑。
 */

const fs = require("node:fs");
const path = require("node:path");
const {
  emitResult,
  exitWithError,
  parseCliArgs,
  renderTaskTemplate,
} = require("./lib/cli-kernel.js");

const root = process.cwd();

const EXPERIENCE_TEMPLATE = `---
title: {title}
update_mode: append_only
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

const TOOL_FEEDBACK_TEMPLATE = `---
timestamp: {timestamp}
context: {context}
reporter: {reporter}
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
      experience: EXPERIENCE_TEMPLATE,
      tool_feedback: TOOL_FEEDBACK_TEMPLATE,
    };
  }

  generateTaskFile(params) {
    return renderTaskTemplate(
      {
        task_id: params.task_id,
        short_id: params.short_id,
        summary: params.summary,
        why_now: params.why_now,
        boundary: params.boundary,
        done_when: params.done_when,
        in_scope: params.in_scope,
        out_of_scope: params.out_of_scope,
        constraints: params.constraints,
        risk: params.risk,
        test_reason: params.test_reason,
        test_scope: params.test_scope,
        test_skip: params.test_skip,
        test_roi: params.test_roi,
        delivery_result: params.delivery_result,
      },
      root
    );
  }

  generateExperienceRecord(params) {
    const defaults = {
      title: "待补充",
      date: new Date().toISOString().split("T")[0],
      related_docs: "待补充",
      background: "待补充",
      decision: "待补充",
      reasoning: "待补充",
      impact: "待补充",
      reuse_guidance: "待补充",
      promotion_criteria: "重复出现 2 次以上且无明显例外的经验，才能候选升格",
    };

    return this.fillTemplate("experience", { ...defaults, ...params });
  }

  generateToolFeedback(params) {
    const defaults = {
      timestamp: new Date().toISOString(),
      context: "任务执行过程中",
      reporter: "开发者",
      tool_name: "待补充",
      experience_description: "待补充",
      pain_points: "待补充",
      improvement_suggestions: "待补充",
      priority: "medium",
      reproducibility: "可复现",
      related_experience: "待补充",
    };

    return this.fillTemplate("tool_feedback", { ...defaults, ...params });
  }

  fillTemplate(templateName, params) {
    let template = this.templates[templateName];
    if (!template) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    for (const [key, value] of Object.entries(params)) {
      template = template.replace(new RegExp(`\\{${key}\\}`, "g"), value);
    }

    return template;
  }

  validateGeneratedContent(content, templateName) {
    const issues = [];
    const placeholderRegex = /\{\{[^}]+\}\}/g;
    const placeholders = content.match(placeholderRegex) || [];
    if (placeholders.length > 0) {
      issues.push(`发现未填充占位符: ${placeholders.join(", ")}`);
    }

    if (content.includes("待补充")) {
      issues.push('发现"待补充"内容，需要完善');
    }

    if (templateName === "task") {
      const requiredSections = ["## 任务摘要", "## 执行合同", "## 交付结果", "### 要做", "### 不做", "### 关键风险", "### 测试策略"];
      const missingSections = requiredSections.filter((section) => !content.includes(section));
      if (missingSections.length > 0) {
        issues.push(`缺失必要章节: ${missingSections.join(", ")}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

class FeedbackLoopManager {
  constructor() {
    this.experienceDir = path.join(root, "memory", "experience");
    this.feedbackDir = path.join(root, "memory", "feedback");
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.feedbackDir)) {
      fs.mkdirSync(this.feedbackDir, { recursive: true });
    }
  }

  recordToolFeedback(feedbackData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `feedback-${feedbackData.tool_name}-${timestamp}.md`;
    const filepath = path.join(this.feedbackDir, filename);
    const generator = new TemplateGenerator();
    const content = generator.generateToolFeedback(feedbackData);
    fs.writeFileSync(filepath, content, "utf8");
    return filepath;
  }

  analyzeFeedbackTrends() {
    if (!fs.existsSync(this.feedbackDir)) {
      return { summary: "暂无反馈数据", trends: [] };
    }

    const files = fs
      .readdirSync(this.feedbackDir)
      .filter((file) => file.startsWith("feedback-") && file.endsWith(".md"))
      .sort()
      .reverse();

    const feedbacks = files.slice(0, 10).map((file) => {
      const content = fs.readFileSync(path.join(this.feedbackDir, file), "utf8");
      return this.parseFeedbackContent(content);
    });

    const toolStats = {};
    const painPointFreq = {};
    const priorityDist = { high: 0, medium: 0, low: 0 };

    feedbacks.forEach((feedback) => {
      if (!toolStats[feedback.tool_name]) {
        toolStats[feedback.tool_name] = { count: 0 };
      }
      toolStats[feedback.tool_name].count += 1;

      feedback.pain_points.split("\n").forEach((point) => {
        const cleaned = point.trim();
        if (cleaned) {
          painPointFreq[cleaned] = (painPointFreq[cleaned] || 0) + 1;
        }
      });

      if (priorityDist[feedback.priority] !== undefined) {
        priorityDist[feedback.priority] += 1;
      }
    });

    return {
      summary: `分析 ${feedbacks.length} 条反馈，涉及 ${Object.keys(toolStats).length} 个工具`,
      trends: {
        topPainPoints: Object.entries(painPointFreq)
          .sort(([, left], [, right]) => right - left)
          .slice(0, 5)
          .map(([point, count]) => ({ point, count })),
        toolUsage: Object.entries(toolStats).map(([tool, stats]) => ({
          tool,
          feedbackCount: stats.count,
        })),
        priorityDistribution: priorityDist,
      },
    };
  }

  parseFeedbackContent(content) {
    const lines = content.split("\n");
    const feedback = {};

    lines.forEach((line) => {
      if (line.startsWith("timestamp:")) {
        feedback.timestamp = line.replace("timestamp: ", "").trim();
      } else if (line.startsWith("tool_name:")) {
        feedback.tool_name = line.replace("tool_name: ", "").trim();
      } else if (line.startsWith("priority:")) {
        feedback.priority = line.replace("priority: ", "").trim();
      } else if (line.startsWith("## 摩擦点")) {
        const startIndex = lines.indexOf(line) + 1;
        const endIndex = lines.findIndex((candidate, index) => index > startIndex && candidate.startsWith("##"));
        feedback.pain_points = lines.slice(startIndex, endIndex === -1 ? undefined : endIndex).join("\n");
      }
    });

    return feedback;
  }

  promoteExperienceToRule(experiencePath) {
    const content = fs.readFileSync(experiencePath, "utf8");
    const titleMatch = content.match(/title: (.+)/);
    const decisionMatch = content.match(/## 决策[\s\S]*?\n\n(.*?)\n\n/);

    if (!titleMatch || !decisionMatch) {
      throw new Error("无法提取经验记录的关键信息");
    }

    return {
      title: titleMatch[1],
      decision: decisionMatch[1],
      path: experiencePath,
    };
  }
}

function defaultTaskTemplateParams() {
  return {
    task_id: "task-XXX",
    short_id: "t-XXX",
    summary: "建立模板生成与反馈闭环机制，防止关键资产漂移",
    why_now: "规则与执行文档最容易在迭代中漂移，需要标准化模板和反馈机制",
    boundary: "从模板治理里承接“任务文档如何稳定生成并被校验”这一段，不扩到整个平台改造。",
    done_when: "模板生成器能稳定产出执行合同结构，且校验器能识别缺项。",
    in_scope: "- 创建任务文件、经验记录、工具反馈的标准化模板\n- 实现模板内容一致性校验\n- 建立工具体验反馈收集与分析机制",
    out_of_scope: "- 不重做整套任务系统",
    constraints: "- 保持模板与主源口径一致",
    risk: "- 模板与主源脱节会重新制造漂移",
    test_reason: "需要锁住模板结构和校验行为",
    test_scope: "模板生成与校验逻辑",
    test_skip: "不做 UI 层验证",
    test_roi: "先保护最容易漂移的模板和校验链",
    delivery_result: "模板生成与反馈闭环建立",
  };
}

function buildUsageText() {
  return [
    "模板生成与反馈闭环编排器",
    "",
    "用法:",
    "  node scripts/ai/template-feedback-orchestrator.js generate-task [--json]",
    "  node scripts/ai/template-feedback-orchestrator.js generate-experience [--json]",
    "  node scripts/ai/template-feedback-orchestrator.js record-feedback [--json]",
    "  node scripts/ai/template-feedback-orchestrator.js analyze-feedback [--json]",
    "  node scripts/ai/template-feedback-orchestrator.js validate-template [--json]",
    "",
    "功能:",
    "  - 模板生成: 标准化任务文件、经验记录、工具反馈的格式",
    "  - 一致性校验: 验证生成内容是否符合模板要求",
    "  - 反馈闭环: 收集、分析工具使用体验，支持经验升格",
    "  - 趋势分析: 识别高频痛点，指导改进优先级",
  ].join("\n");
}

function runCommand(command, generator, feedbackManager) {
  switch (command) {
    case "generate-task":
      return generateTaskTemplate(generator);
    case "generate-experience":
      return generateExperienceTemplate(generator);
    case "record-feedback":
      return recordToolFeedback(feedbackManager);
    case "analyze-feedback":
      return analyzeFeedbackTrends(feedbackManager);
    case "validate-template":
      return validateTemplateContent(generator);
    default:
      return {
        ok: true,
        command: null,
        usage: buildUsageText(),
      };
  }
}

function generateTaskTemplate(generator) {
  const content = generator.generateTaskFile(defaultTaskTemplateParams());
  const validation = generator.validateGeneratedContent(content, "task");

  return {
    ok: true,
    command: "generate-task",
    content,
    validation,
  };
}

function generateExperienceTemplate(generator) {
  const content = generator.generateExperienceRecord({
    title: "模板生成减少文档漂移",
    background: "文档资产在迭代中容易失去一致性，影响团队协作效率",
    decision: "采用标准化模板生成关键文档，确保格式和内容一致性",
    reasoning: "模板化能强制遵循最佳实践，减少人为疏忽导致的质量问题",
    impact: "提高文档质量，降低维护成本，增强团队协作效率",
    reuse_guidance: "适用于所有需要标准化的文档资产，优先在高频修改场景使用",
  });

  return {
    ok: true,
    command: "generate-experience",
    content,
  };
}

function recordToolFeedback(feedbackManager) {
  const pathToFile = feedbackManager.recordToolFeedback({
    tool_name: "diff-aware-qa-orchestrator",
    context: "t-023 任务实施过程中",
    reporter: "AI Assistant",
    experience_description: "diff-aware QA 编排器能有效分析改动影响面，但需要手动指定参数",
    pain_points: "需要手动运行，不能自动集成到现有流程\n健康评分算法需要更多调优",
    improvement_suggestions: "集成到 pre-landing 检查流程\n提供配置文件自定义评分权重",
    priority: "medium",
    reproducibility: "可复现",
    related_experience: "exp-002-memory-before-promotion",
  });

  return {
    ok: true,
    command: "record-feedback",
    path: pathToFile,
  };
}

function analyzeFeedbackTrends(feedbackManager) {
  const analysis = feedbackManager.analyzeFeedbackTrends();
  return {
    ok: true,
    command: "analyze-feedback",
    analysis,
  };
}

function validateTemplateContent(generator) {
  const validContent = generator.generateTaskFile({
    task_id: "task-validate-test",
    short_id: "t-validate",
    summary: "验证模板内容",
    why_now: "确保模板生成质量",
    boundary: "只验证模板生成和字段完整性",
    done_when: "模板验证能发现关键缺项",
    in_scope: "- 测试模板验证功能",
    out_of_scope: "- 不做 UI 预览",
    constraints: "- 保持当前模板契约",
    risk: "- 漏检会让旧结构混回系统",
    test_reason: "需要验证模板校验器本身",
    test_scope: "生成内容与必填章节",
    test_skip: "不测经验模板",
    test_roi: "锁住最小主链",
    delivery_result: "模板验证可用",
  });

  const invalidContent = validContent
    .replace("## 任务摘要", "## 任务摘要（已填写）")
    .replace("验证模板内容", "待补充");

  return {
    ok: true,
    command: "validate-template",
    valid_result: generator.validateGeneratedContent(validContent, "task"),
    invalid_result: generator.validateGeneratedContent(invalidContent, "task"),
  };
}

function renderTextResult(result) {
  if (!result.command) {
    return result.usage;
  }

  switch (result.command) {
    case "generate-task":
      return [
        "📋 生成的任务文件模板:",
        result.content,
        "",
        "🔍 验证结果:",
        result.validation.valid ? "✅ 模板有效" : "❌ 发现问题:",
        ...result.validation.issues.map((issue) => `  - ${issue}`),
      ].join("\n");
    case "generate-experience":
      return ["📋 生成的经验记录模板:", result.content].join("\n");
    case "record-feedback":
      return `✅ 反馈已记录到: ${result.path}`;
    case "analyze-feedback": {
      const analysis = result.analysis;
      const lines = ["📊 反馈趋势分析:", analysis.summary];
      if (analysis.trends && analysis.trends.topPainPoints?.length) {
        lines.push("", "🔝 高频痛点:");
        analysis.trends.topPainPoints.forEach((item) => lines.push(`  - ${item.point} (${item.count} 次)`));
        lines.push("", "🛠️ 工具使用情况:");
        analysis.trends.toolUsage.forEach((tool) => lines.push(`  - ${tool.tool}: ${tool.feedbackCount} 条反馈`));
        lines.push("", "📈 优先级分布:");
        Object.entries(analysis.trends.priorityDistribution).forEach(([priority, count]) => {
          lines.push(`  - ${priority}: ${count}`);
        });
      }
      return lines.join("\n");
    }
    case "validate-template":
      return [
        "🔍 模板验证测试:",
        "",
        "✅ 有效模板验证:",
        result.valid_result.valid ? "通过验证" : `发现问题: ${result.valid_result.issues.join(", ")}`,
        "",
        "❌ 无效模板验证:",
        result.invalid_result.valid ? "意外通过" : `正确发现问题: ${result.invalid_result.issues.join(", ")}`,
      ].join("\n");
    default:
      return JSON.stringify(result, null, 2);
  }
}

function main() {
  const cli = parseCliArgs(process.argv.slice(2));
  const generator = new TemplateGenerator();
  const feedbackManager = new FeedbackLoopManager();

  try {
    const command = cli.positionals[0];
    const result = runCommand(command, generator, feedbackManager);
    emitResult(result, cli, renderTextResult);
    return 0;
  } catch (error) {
    exitWithError(error instanceof Error ? error.message : String(error), cli);
  }
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { TemplateGenerator, FeedbackLoopManager };
