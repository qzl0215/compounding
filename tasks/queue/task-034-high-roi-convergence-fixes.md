# 高 ROI 收敛修复

## 短编号

t-034


## 目标

收口 task 解析、release cutover、roadmap 真相源与交付快照展示层


## 为什么

当前仓库仍存在短编号与脚本口径不一致、release 切换短暂漂移、roadmap frontmatter 自相矛盾、DeliverySnapshot 仍夹杂原始事实与页面投影、任务页主表仍暴露内部路径。这些都是低成本但高收益的收敛点。


## 范围

- 统一 task resolver
- 修复 release cutover 时序
- 收口 `roadmap.md` 真相源 frontmatter
- 继续瘦身 `DeliverySnapshot`
- 提升任务页主表可读性

## 范围外

- 不新增新的持久化真相源
- 不改变 `main` / `dev` 的发布模型
- 不扩新页面或新平台
- 不重做现有 Markdown 真相源体系

## 约束

- 继续保持 release 是验收与回滚边界、task 是执行边界
- 只做高 ROI 收敛，不做额外功能扩张
- 所有页面状态必须继续通过同一份派生交付层读取

## 关联模块

- `shared/task-identity.ts`
- `scripts/ai/lib/task-resolver.ts`
- `scripts/release/lib.ts`
- `scripts/release/switch-release.ts`
- `scripts/release/accept-dev-release.ts`
- `apps/studio/src/modules/delivery/*`
- `apps/studio/src/modules/tasks/*`
- `memory/project/roadmap.md`
- `memory/project/current-state.md`
- `memory/project/operating-blueprint.md`
- `scripts/compounding_bootstrap/catalog.py`

## 当前模式

发布复盘


## 分支

`codex/task-034-high-roi-convergence-fixes`


## 最近提交

`auto: branch HEAD`

## 交付收益

把最常用的任务标识、发布切换与交付读模型统一口径，减少脚本误用、页面误判和真相源漂移。


## 交付风险

若 cutover 时序修错，可能导致 production 短暂漂移或重启异常；若 snapshot 收口过度，首页、任务页、发布页可能出现状态缺口。


## 一句复盘

统一了短编号与脚本口径，补齐了 production cutover 闭环，并继续压缩交付读模型与任务主表的冗余展示。


## 主发布版本

`20260319162635-06a067e-prod`


## 关联发布版本

`20260319160614-06a067e-dev`


## 计划

1. 统一 `t-xxx / task-xxx / tasks/queue/*.md` 的 task resolver。
2. 修复 production cutover 时序并补齐自动稳定动作。
3. 收口 `roadmap.md` 与 scaffold catalog 的真相源 frontmatter。
4. 去掉 `DeliverySnapshot` 对原始 task 列表的暴露，改用明确 projection。
5. 把任务页主表的内部路径下沉到展开详情。

## 发布说明

完成后先生成 `dev` 预览；若已有未验收 `dev`，先处理旧预览，再进入本轮验收与发布。

## 验收标准

- `t-033`、`task-033-...`、`tasks/queue/task-033-....md` 都能解析到同一 task
- `switch-release` 后直接读取 `prod:status` 不再出现 transient drift
- `roadmap.md` 的 frontmatter 与真相源地图一致
- 首页、任务页、发布页继续显示一致的交付状态
- `/tasks` 主表不再平铺内部路径，展开详情仍保留工程排障信息
## 风险

- 脚本侧与页面侧若只修一半，会继续保留双口径
- runtime 自动稳定若条件判断过宽，可能对未运行的 production 做无意义动作
- 这轮改动横跨脚本、页面、记忆主源，回写不完整会再次制造漂移
## 状态

done

## 更新痕迹

- 记忆：`memory/project/current-state.md, memory/project/operating-blueprint.md`
- 索引：`no change: current scope only`
- 路线图：`memory/project/roadmap.md`
- 文档：`tasks/queue/task-034-high-roi-convergence-fixes.md, memory/project/current-state.md, memory/project/roadmap.md, memory/project/operating-blueprint.md`

## 复盘

- 统一 task resolver 后，`t-xxx`、文件基名与完整路径终于不再双口径。
- `release:prepare` 的根脚本硬编码 `--ref main` 是一个真实高频误用点，这轮顺手收掉后预览链路才真正闭环。
- cutover 现在会先更新 active release，再 reload / stabilize，本地 production 不再依赖额外手动 restart 才收敛。
