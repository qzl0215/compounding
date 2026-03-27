const fs = require("node:fs");
const path = require("node:path");

/**
 * @typedef {Object} TaskTemplateValues
 * @property {string} [task_id]
 * @property {string} [short_id]
 * @property {string} [parent_plan]
 * @property {string} [summary]
 * @property {string} [why_now]
 * @property {string} [boundary]
 * @property {string} [done_when]
 * @property {string} [delivery_track]
 * @property {string} [in_scope]
 * @property {string} [out_of_scope]
 * @property {string} [constraints]
 * @property {string} [risk]
 * @property {string} [test_reason]
 * @property {string} [test_scope]
 * @property {string} [test_skip]
 * @property {string} [test_roi]
 * @property {string} [status]
 * @property {string} [acceptance_result]
 * @property {string} [delivery_result]
 * @property {string} [retro]
 * @property {string} [branch]
 * @property {string} [related_modules]
 * @property {string} [update_trace_memory]
 * @property {string} [update_trace_index]
 * @property {string} [update_trace_roadmap]
 * @property {string} [update_trace_docs]
 */

const DEFAULT_TASK_TEMPLATE_VALUES = Object.freeze({
  task_id: "task-XXX",
  short_id: "t-XXX",
  parent_plan: "memory/project/operating-blueprint.md",
  summary: "待补充：用中文直给概述这件事要交付什么结果，不要把英文 task 名当标题。",
  why_now: "待补充：说明为什么现在要做。",
  boundary: "待补充：写明这个 task 从 plan 承接的那一段清晰边界；若价值判断、范围外或 taste decision 仍未收口，请先回到 plan。",
  done_when: "待补充：写明体验级交付结果，而不是实现动作；若仍是实现动作，说明决策未收口。",
  delivery_track: "undetermined",
  in_scope: "- 待补充：列出这次明确要做的事项。",
  out_of_scope: "- 待补充：列出这次明确不做的事项。",
  constraints: "- 待补充：列出必须遵守的边界、依赖和冻结项；仍需人判断的只允许是价值判断、体验取舍或最终验收。",
  risk: "- 待补充：说明最大的回归或发布风险。",
  test_reason: "待补充。",
  test_scope: "待补充。",
  test_skip: "待补充。",
  test_roi: "待补充。",
  status: "todo",
  acceptance_result: "待验收",
  delivery_result: "未交付",
  retro: "未复盘",
  branch: "codex/task-XXX",
  related_modules: "",
  update_trace_memory: "no change: 未更新",
  update_trace_index: "no change: 未更新",
  update_trace_roadmap: "no change: 未更新",
  update_trace_docs: "no change: 未更新",
});

function getTaskTemplatePath(root = process.cwd()) {
  return path.join(root, "tasks", "templates", "task-template.md");
}

function loadTaskTemplate(root = process.cwd()) {
  return fs.readFileSync(getTaskTemplatePath(root), "utf8");
}

/**
 * @param {TaskTemplateValues} values
 * @param {string} [root]
 */
function renderTaskTemplate(values = {}, root = process.cwd()) {
  const merged = {
    ...DEFAULT_TASK_TEMPLATE_VALUES,
    ...values,
  };
  const rendered = loadTaskTemplate(root).replace(/\{\{([a-z0-9_]+)\}\}/gi, (_, key) => {
    const value = merged[key];
    return value === undefined || value === null ? "" : String(value);
  });
  const unresolved = rendered.match(/\{\{[a-z0-9_]+\}\}/gi);
  if (unresolved?.length) {
    throw new Error(`Unresolved task template placeholders: ${unresolved.join(", ")}`);
  }
  return rendered;
}

module.exports = {
  DEFAULT_TASK_TEMPLATE_VALUES,
  getTaskTemplatePath,
  loadTaskTemplate,
  renderTaskTemplate,
};
