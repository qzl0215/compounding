# 任务 task-054-kernel-shell-mvp

## 任务摘要

- 短编号：`t-054`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  把当前 Compounding 仓库推进到 `single-kernel + project-shell` 的最小可运行闭环，优先打通老项目 `attach -> audit -> proposal`，再补新项目最小 `bootstrap` 和低风险 `apply`。
- 为什么现在：
  现有 bootstrap 已经能 scaffold / audit / proposal，但还没有把 `kernel / shell` 边界、老项目中接入和新项目最小冷启动收成统一协议。
- 承接边界：
  只做协议层、schema/template、bootstrap 命令和低风险资产同步；不自动改业务核心代码、部署主入口、生产脚本，也不做复杂 profile/overlay。
- 完成定义：
  当前仓库能作为老项目跑通 `attach / audit / proposal`；空目录能跑通最小 `bootstrap`；低风险 `auto_apply` 资产可以安全应用；结果有 task 与 memory 回写。

## 执行合同

### 要做

- 新增 `project_brief / kernel_manifest / bootstrap_report / proposal / experience_promotion` 的 YAML schema 与 template。
- 新增 `kernel/kernel_manifest.yaml`，固定 `managed / shell / generated / protected` 四类边界。
- 实现 `attach`、`audit`、`proposal`、`bootstrap` 命令，并保留 `scaffold`、`propose` 兼容别名。
- 用当前仓库产出 attach 示例，并提交 `examples/compounding-attach/*`。
- 实现最小 `apply-proposal`，只处理 kernel proposal 中的 `auto_apply` 路径。

### 不做

- 不自动修改业务核心代码。
- 不自动修改部署主入口和生产脚本。
- 不做通用 apply 编排、复杂 profile/overlay 或退役框架。
- 不做大规模目录重构。

### 约束

- 保留现有 `vision / roadmap / operating-blueprint / task / release / memory` 体系，不推翻主干协议。
- 老项目优先中接入：先接协议层，不先重构业务层。
- `proposal` 先于 `apply`；`apply` 只处理低风险资产。

### 关键风险

- 若 `auto_apply` 分类过宽，会误把需要 review 的协议文档或脚本自动落盘。
- 若 task / memory 不同步，仓库会出现代码已变但执行合同缺位的结构债。

### 测试策略

- 为什么测：这轮改动跨 schema、CLI、协议资产和低风险 apply，需要同时验证老项目接入和新项目冷启动。
- 测什么：`attach / audit / proposal / bootstrap / apply-proposal` 的 Python 单测，以及仓库内 `pnpm bootstrap:audit`。
- 不测什么：不重做整仓 build/release 流，不新增业务层测试。
- 当前最小集理由：先保护 kernel/shell 协议链是否可运行，再决定是否扩大自动同步范围。

## 交付结果

- 状态：done
- 体验验收结果：
  当前仓库已能作为老项目 attach 示例运行；空目录能生成最小 project shell；低风险 auto-apply 只会补齐协议层资产。
- 交付结果：
  新增 schema/template/kernel manifest、attach/audit/proposal/bootstrap/apply-proposal 链路、当前仓库示例产物和 MVP 实施说明；同时把 task template/create-task 补到默认带最小 machine facts，避免 structural task 再靠手工补 `关联模块` 才能通过 scope guard。
- 复盘：
  真正值钱的不是再造一套抽象，而是先把老项目接协议层和新项目最小起壳做成低风险闭环；`apply` 必须严格限制在 `auto_apply`，否则很容易重新把 proposal 变成隐性重写。

## 当前模式

工程执行

## 分支

`main`

## 关联模块

- `bootstrap/project_brief.yaml`
- `memory/project/current-state.md`
- `memory/project/operating-blueprint.md`
- `package.json`
- `MVP_IMPLEMENTATION_PLAN.md`
- `examples/`
- `kernel/`
- `schemas/`
- `templates/`
- `tasks/templates/task-template.md`
- `scripts/ai/create-task.ts`
- `scripts/ai/lib/task-template.js`
- `scripts/compounding_bootstrap/`
- `tests/`

## 更新痕迹

- 记忆：`memory/project/current-state.md` 已回写 kernel/shell MVP 闭环与当前检查点。
- 索引：`no change: 未更新`
- 路线图：`memory/project/operating-blueprint.md` 已补 `t-054` 的完成态与下一步 focus。
- 文档：`MVP_IMPLEMENTATION_PLAN.md` 已补 attach / audit / proposal / bootstrap / apply-proposal 的运行与验证说明。
