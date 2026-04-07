# task-004-dashboard-and-cognition-architecture

## 短编号

t-004

## 目标

把首页重构成真正的经营驾驶舱，并补齐 `operating-blueprint` 真相源、轻量 task SOP 和自然 Markdown 阅读层级。

## 为什么

当前首页仍然是旧的公司介绍页逻辑，信息结构还不够像经营驾驶舱；同时 `memory / task / index` 的边界还不够清楚，Markdown 正文层级也被重样式覆盖。

## 范围

- 首页改成 5 个高浓度模块
- 新增 `memory/project/operating-blueprint.md`
- 收口 `roadmap / operating-blueprint / task / memory / index` 的边界
- task 模板升级为轻量 SOP
- 文档页恢复自然 Markdown 层级
- 首页取消右侧导航，文档页/任务页/发布页保留右侧粘性目录

## 范围外

- 新增数据库或读模型
- 扩重型项目管理后台
- 引入 lane / worktree / 多分支重制度
- 远端发布或真实服务器 cutover

## 约束

- Markdown 仍是唯一真相源
- 首页必须是一页短滚动，且本身承担导航作用
- 规范继续做减法，不新增平行体系
- 所有改动都要回写 task / memory / docs，索引仅在需要时更新

## 关联模块

- `apps/studio/src/modules/portal`
- `apps/studio/src/modules/docs`
- `apps/studio/src/modules/tasks`
- `scripts/compounding_bootstrap/*`
- `scripts/ai/*`
- `memory/project/*`
- `docs/*`

## 当前模式

发布复盘

## 分支

`main (legacy direct release)`

## 最近提交

`1782d4c`

## 交付收益

建立经营驾驶舱与认知架构的第一版共同骨架，让首页、memory 与任务系统能围绕同一主线演进。

## 交付风险

若认知架构只停留在展示层而没有回写主线文档，后续仍会形成多套口径。

## 一句复盘

先有统一认知骨架，后续页面和规则层才可能稳定收口。

## 计划

- 新增 `operating-blueprint` 文档，并同步更新 roadmap/current-state/AGENTS
- 重构首页数据模型与 5 模块布局
- 调整 Markdown 样式，恢复自然层级
- 更新 task 模板、create-task、heading alias、build-context、audit

## 发布说明

这轮只改本地 `main` 和本地门户展示，不做真实服务器发布切换；验收以本地 `pnpm build` 和门户探活为准。

## 验收标准

- 首页只保留 5 个经营驾驶舱模块，且无右侧导航
- 文档页的 `# / ## / ###` 层级恢复自然阅读感
- `memory/project/operating-blueprint.md` 成为当前里程碑拆解真相源
- `roadmap / operating-blueprint / task / memory / index` 的边界在文档中清楚
- task 模板具备计划 / 发布说明 / 验收标准 / 复盘

## 风险

- 首页数据模型变更可能牵连多处解析逻辑
- scaffold 若未同步修改，后续可能把文档冲回旧结构
- 标题中文化后若 alias 不完整，会导致摘要和校验失效

## 状态

done

## 更新痕迹

- 记忆：`no change: historical task metadata alignment only`
- 索引：`no change: historical task metadata alignment only`
- 路线图：`no change: current priority unchanged`
- 文档：`tasks/queue/task-004-dashboard-and-cognition-architecture.md`

## 复盘

- 首页不该再承载“新人模块”或右侧目录；经营驾驶舱本身就是阅读顺序和导航。
- `operating-blueprint` 把里程碑拆解从 roadmap 中剥离出来后，首页叙事和 AI 执行链都更清楚。
- Markdown 阅读问题的根因不是富文本缺失，而是标题样式过重；恢复自然层级比继续堆视觉组件更有效。
