# 产品化黄金实例与三模式脚手架

## 任务摘要

- 任务 ID：`task-072-golden-instance-three-mode-scaffold`
- 短编号：`t-072`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  产品化黄金实例与三模式脚手架
- 为什么现在：
  当前仓库已经有 attach/bootstrap/audit/proposal/doctor 和 summary harness，但还没有把黄金实例、自身最佳实践和三种外部接入模式收成统一产品；现在补 pack、mode、adapter 和 readiness gate，才能稳定服务新项目冷启动、老项目规范化和 AI 底座升级。
- 承接边界：
  只扩现有 bootstrap/kernel/proposal/doctor/test 主链：定义 pack 与 mode 契约、最小 adapter、pack export、mode-aware readiness 和 golden repo matrix；不拆新仓，不重写 runtime/release，不扩到 Studio UI。
- 完成定义：
  黄金实例可导出 pack；三种模式能稳定映射到 packs；doctor 能输出 recommended_mode、adapter、required_packs 和 AI readiness；proposal/apply 能按 selected packs 工作；最小 golden repo matrix 覆盖三模式回归。

## 执行合同

### 要做

- `kernel/` 与 schema/template 的 pack/mode 契约
- `scripts/compounding_bootstrap/` 的 mode/adapter/doctor/proposal/apply/export
- `bootstrap/` 默认 brief/operator 模板与示例
- `scripts/ai/` 中与 operator/tooling pack 直接相关的入口
- `docs/OPERATOR_RUNBOOK.md`、`CLAUDE.md`、`OPENCODE.md`、`.cursor/rules/*` 等生成入口
- `scripts/coord/` 与 `scripts/local-runtime/` 中被 summary / preflight / runtime gate 直接消费的入口
- `apps/studio/src/modules/project-state/` 的最小模块文档补齐
- `tasks/queue/task-070-summary-first-harness.md` 与 `tasks/queue/task-071.md` 的分支绑定收口
- `tests/` 与 golden repo fixtures

### 不做

- 不拆独立仓库或发布外部包
- 不导出 Studio UI、本仓 runtime 私有脚本、release 私有链路
- 不做 home 目录级个人环境安装
- 不引入数据库、远程服务或新后台

### 约束

少加代码，优先复用现有 manifest/attach/audit/proposal/doctor 链；对外只暴露 cold_start/normalize/ai_upgrade 三种模式；adapter 第一阶段只支持 generic_repo、node_service、web_app、python_service。

### 关键风险

如果 pack 边界不稳，会把本仓私有资产错误导出；如果 mode 和 profile 双轨并存但语义不清，会继续增加外部接入成本；如果 golden matrix 太薄，脚手架仍可能只在本仓成立。

### 测试策略

- 为什么测：这是脚手架产品化改动，必须锁住三模式映射、pack 导出、adapter 推断、doctor readiness 和 proposal/apply 的 pack 选择行为。
- 测什么：pack parity、mode mapping、adapter detection、doctor readiness、proposal/apply selected packs、golden repo matrix smoke。
- 不测什么：不做真实远程部署、外部 GitHub/provider 联调，不覆盖 Studio UI 和 runtime 私有链路导出。
- 当前最小集理由：优先用最少样本验证三模式对外可用性，避免继续只在本仓自洽。

## 交付结果

- 状态：doing
- 体验验收结果：
  已完成：三模式脚手架现在能稳定输出 `recommended_mode / requested_mode / adapter_id / required_packs / ready_for_ai_iteration`；`cold_start` 与 `normalize` 默认落协议+operator+tooling，`ai_upgrade` 额外带 execution pack；主仓 `doctor --target .` 已恢复 `ok=true`。
- 交付结果：
  - `kernel_manifest` 新增 `packs` 与 `mode_packs`，并补齐 `copy_paths / generated_paths / compatible_adapters / smoke_commands`
  - `doctor / bootstrap / attach / operator_contract / proposal` 已按 selected packs 和 supported mode 工作
  - `export-packs` 现在会导出 pack 清单、文件校验和与 mode pack 摘要
  - `project_brief / project_operator / bootstrap_report / proposal` schema 与模板已升级到三模式语义
  - attach/bootstrap 归一化已补“去 Compounding 化”逻辑，外部仓不再继承黄金实例自己的 project name / one-liner / critical paths / blocked paths
  - 回归测试已覆盖：mode mapping、ai_upgrade smoke、pack export、selected-pack proposal、doctor 降级推荐
- 复盘：
  最值得保留的实现边界是：不把 attach 扩成重型安装器，继续保持 `attach -> audit/doctor -> proposal` 的低侵入接入链；真正新增的复杂度集中在 pack/mode 解析和归一化层，而不是散落到更多命令分支。

## 当前模式

工程执行

## 分支

`codex/task-072-golden-instance-three-mode-scaffold`

## 关联模块

- `kernel/`
- `bootstrap/`
- `examples/`
- `schemas/`
- `templates/`
- `scripts/compounding_bootstrap/`
- `scripts/ai/`
- `scripts/coord/`
- `scripts/local-runtime/`
- `docs/`
- `.cursor/`
- `CLAUDE.md`
- `OPENCODE.md`
- `apps/studio/src/modules/project-state/`
- `tasks/queue/task-070-summary-first-harness.md`
- `tasks/queue/task-071.md`
- `package.json`
- `tests/`

## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：no change: 未更新
