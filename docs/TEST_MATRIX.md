---
title: TEST_MATRIX
update_mode: manual
status: active
last_reviewed_at: 2026-03-27
source_of_truth: AGENTS.md
related_docs:
  - docs/ARCHITECTURE.md
  - docs/DEV_WORKFLOW.md
  - docs/PROJECT_RULES.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 测试矩阵

## 原则

- 先放到最轻、最能直接观察失败的层。
- 同一行为只保留一层主断言。
- 能由 `apps/studio/src/**/__tests__` 观察到的，不再重复搬到 `tests/`。
- `scripts/*` 只走 repo fixture / 最小 smoke，不单独再长一套长期测试族。

## 一页矩阵

| 层级 | 目录 / 命令 | 负责的失败类型 | 适合放什么 | 不要放什么 | 默认成本 |
| --- | --- | --- | --- | --- | --- |
| 模块单测 | `apps/studio/src/**/__tests__` | 单模块行为、渲染、纯函数、局部数据流 | service、mapper、formatter、component | CLI、workspace、release、跨进程契约 | 最低 |
| 仓级契约 | `tests/` | 跨进程、跨工作区、CLI、fixture、golden | `preflight`、`validate-*`、`generate-*`、任务链接/变更链路 | 与模块单测重复的实现细节 | 低 |
| 共享 helper | `shared/*` 先由消费者层覆盖 | 被多个高价路径共享的 parser / normalizer / scorer | 只有多处复用、且 consumer 层不够窄时才补直测 | 单一消费者内部逻辑 | 低到中 |
| 脚本门禁 | `tests/` 里的 fixture + smoke | `scripts/ai/*`、`scripts/coord/*`、`scripts/release/*` 的行为契约 | 入口参数、输出结构、文件生成、repo 状态依赖 | 再建一套脚本专属长期测试族 | 中 |
| 任务队列文档 | `tasks/queue/*` | 人类执行合同和测试边界 | 测试策略、非目标、必测边界 | 可执行测试代码 | 只记策略 |

## 运行约定

- `pnpm test` 是仓级最小回归包，由 `apps/studio` Vitest 和 `tests/` Python 契约测试组成。
- `pnpm validate:static`、`pnpm validate:build`、`pnpm preview:check`、`pnpm prod:check` 是不同门禁层，不要混进测试矩阵里重复描述。
- 新增用例优先写到能直接看到失败的层；如果更轻的一层已经能覆盖，就不要再升层。
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
