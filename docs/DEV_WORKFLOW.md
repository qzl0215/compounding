---
title: DEV_WORKFLOW
doc_role: operation
update_mode: manual
owner_role: Builder
status: active
last_reviewed_at: 2026-03-15
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - docs/AI_OPERATING_MODEL.md
  - tasks/templates/task-template.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 开发工作流

## 主发布规则

- `main` 是唯一生产主线
- 本地短分支仍可用于临时开发，但发布动作只认 `main`
- 不再使用 `dev` 作为发布缓冲层

## 标准流程

1. 先读 `AGENTS.md`
2. 再读 `docs/PROJECT_RULES.md`、`docs/ARCHITECTURE.md`
3. 再读 `memory/project/roadmap.md` 和 `memory/project/operating-blueprint.md`
4. 若里程碑、蓝图或关键发布标准不清晰，先创建规划 task，并与用户共商后再继续
5. 再读当前任务文件、相关 `module.md`、`code_index/*`
6. 运行 `python3 scripts/pre_mutation_check.py`
7. 完成最小可验证改动
8. 更新 `task / memory / code_index / docs`
9. 完成 review，并让改动进入 `main`
10. 运行 `node --experimental-strip-types scripts/release/prepare-release.ts --ref main`
11. 构建与 smoke 通过后，再运行 `node --experimental-strip-types scripts/release/switch-release.ts --release <release-id>`

## 汇报契约

- 默认回复结构：
  - 已完成清单
  - 证据与当前结论适用边界
  - 风险与待决策
  - 下一步
- 所有关键报告必须显式区分：
  - 本地离线证据
  - 服务器真实证据
  - 当前结论适用边界

## 任务规则

- 每个结构性改动必须绑定 `tasks/queue/*`
- 默认先更新 task，再改代码；改完后补齐更新痕迹和必要回写
- 任务至少包含 目标 / 为什么 / 范围 / 范围外 / 约束 / 关联模块 / 计划 / 发布说明 / 验收标准 / 风险 / 状态 / 更新痕迹 / 复盘
- 修改结束后要同步更新任务状态和验收结果
- `更新痕迹` 必须明确写出：
  - 记忆
  - 索引
  - 路线图
  - 文档
  若某项无变化，写 `no change: <reason>`

## 发布规则

- 新版本必须先在后台 release 目录完成准备，再切换 `current`
- 切换失败前不得影响当前线上版本
- 回滚通过 `scripts/release/rollback-release.ts` 或本机/内网发布管理页执行
- 发布和回滚动作必须串行执行，release lock 未释放前不得触发第二个动作
- 对于 Next.js 门户，服务重载采用 `systemctl restart` 或等价最小重启

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
