# 任务 task-018-local-entry-port-migration

## 短编号

t-118


## 目标

把本地生产和 dev 预览默认入口从 3000/3001 迁移到 3010/3011，避免与其他项目端口冲突，并同步文档、测试与运行态说明。


## 为什么

当前本地入口端口与常见项目默认值冲突，容易出现“页面打不开”或“误以为是当前项目坏了”的情况。迁移到更少冲突的端口后，日常验收和本地生产启动会更稳定。


## 范围

- 更新本地生产与 dev 预览脚本默认端口
- 更新 release / runtime 状态读取中的默认 base url
- 更新文档系统中的端口约定说明
- 更新相关测试断言

## 范围外

- 不改变 release 机制
- 不改变 task / release 的关系模型
- 不扩展远端部署能力

## 约束

- 本地生产仍然只认手动拉起
- `main` 仍然是唯一生产主线
- `dev` 仍然只是 preview channel

## 关联模块

- `scripts/local-runtime/*`
- `scripts/release/lib.ts`
- `apps/studio/src/modules/releases/service.ts`
- `apps/studio/package.json`
- `docs/AGENTS.md`
- `docs/DEV_WORKFLOW.md`
- `docs/AI_OPERATING_MODEL.md`
- `apps/studio/src/modules/releases/__tests__/*`
- `apps/studio/src/modules/tasks/__tests__/*`
- `tests/test_bootstrap_cli.py`

## 当前模式

发布复盘


## 分支

`main`


## 最近提交

`19808d2c290b7164bbc12e71f508300861cf27b2`

## 交付收益

把本地生产与 dev 预览切到更不容易冲突的端口，减少“打开页面失败但其实是别的项目占位或默认入口冲突”的误判，提高本机验收的稳定性。

## 交付风险

如果文档、测试和运行时端口默认值不同步，容易再次出现“代码已迁移，但外部链接还在指向旧端口”的问题。

## 一句复盘

未复盘

## 主发布版本

20260317114615-a6a4366-prod

## 关联发布版本

20260317114615-a6a4366-prod

## 计划

1. 把本地生产与 dev 预览的默认端口迁移到 3010/3011。
2. 同步 release / runtime 的链接生成逻辑与测试断言。
3. 启动本地 production，并确认 `prod:check` 通过。

## 发布说明

本任务的发布影响仅限本地入口端口迁移，不改变 release 模型与业务功能。

## 验收标准

- 本地生产默认在 `3010` 提供服务
- dev 预览默认在 `3011` 提供服务
- `/releases` 与 runtime 状态页面显示新的默认端口
- 相关测试通过

## 风险

- 旧的 3000/3001 入口如果还被人拿来访问，会继续得到拒绝连接，这属于预期行为
- 若其他脚本仍写死旧端口，可能产生短暂不一致

## 状态

done

## 更新痕迹

- 记忆：`memory/project/current-state.md`
- 索引：`no change: no index impact`
- 路线图：`no change: current priority unchanged`
- 文档：`AGENTS.md, docs/DEV_WORKFLOW.md, docs/AI_OPERATING_MODEL.md`

## 复盘

- 本地入口端口迁移后，运行态状态和页面链接都应以同一组默认端口为准，避免在不同脚本之间反复切换。
