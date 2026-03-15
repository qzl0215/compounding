# task-001-repo-refactor

## Goal

把当前仓库升级成真正可持续的 AI-Native Repo，并完成第一批高价值微模块收敛。

## Why

当前仓库仍残留旧 workflow 前台、旧 docs 体系和巨型 bootstrap 引擎，不利于 AI 长期协作和多 agent 并行。

## Scope

- 建立 docs / memory / code_index / tasks / scripts/ai 骨架
- 收敛 Studio 到只读门户
- 拆分 bootstrap 引擎的第一批模块
- 显式记录技术债和 ADR

## Out of Scope

- 大面积业务逻辑重写
- 恢复多步骤 workflow 前台
- 引入数据库或复杂平台基础设施

## Constraints

- 不过度工程
- 新增代码必须伴随清理
- 改动前先过 preflight
- 关键行为保持稳定

## Related Modules

- `apps/studio/src/modules/docs`
- `apps/studio/src/modules/portal`
- `apps/studio/src/modules/git-health`
- `scripts/compounding_bootstrap/*`
- `scripts/ai/*`

## Acceptance Criteria

- 规则层、记忆层、上下文层全部存在且可用
- 第一批微模块已落地
- 旧 workflow 前台已从默认构建入口移除
- `pnpm build`、`pnpm test`、`bootstrap:audit` 通过

## Risks

- bootstrap 行为回归
- 文档结构切换导致旧路径失效
- 索引脚本第一版准确度有限

## Status

in_progress
