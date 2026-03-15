# task-001-repo-refactor

## Goal

把当前仓库升级成真正可持续的 AI-Native Repo，并补齐 `main` 直发生产、后台准备版本、原子切换和快速回滚的第一版骨架。

## Why

当前仓库仍残留旧 workflow 前台、旧 docs 体系和巨型 bootstrap 引擎，不利于 AI 长期协作和多 agent 并行。

## Scope

- 建立 docs / memory / code_index / tasks / scripts/ai 骨架
- 收敛 Studio 到只读门户
- 拆分 bootstrap 引擎的第一批模块
- 显式记录技术债和 ADR
- 建立 release registry、部署脚本、本机管理页和回滚入口

## Out of Scope

- 大面积业务逻辑重写
- 恢复多步骤 workflow 前台
- 引入数据库、复杂编排层或多机发布系统

## Constraints

- 不过度工程
- 新增代码必须伴随清理
- 改动前先过 preflight
- 关键行为保持稳定

## Related Modules

- `apps/studio/src/modules/docs`
- `apps/studio/src/modules/portal`
- `apps/studio/src/modules/git-health`
- `apps/studio/src/modules/releases`
- `scripts/compounding_bootstrap/*`
- `scripts/ai/*`
- `scripts/release/*`

## Acceptance Criteria

- 规则层、记忆层、上下文层全部存在且可用
- 第一批微模块已落地
- 旧 workflow 前台已从默认构建入口移除
- `main` 直发生产模型、release registry 和 rollback 入口可用
- `pnpm build`、`pnpm test`、`bootstrap:audit` 通过

## Risks

- bootstrap 行为回归
- 文档结构切换导致旧路径失效
- 索引脚本第一版准确度有限
- 单机发布模型仍依赖 systemd/reverse proxy 真实环境验证

## Status

in_progress
