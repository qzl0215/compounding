# 任务 task-003-homepage-company-org-model

## 目标

把首页升级成“创业团队 operating system”，并新增 `docs/ORG_MODEL.md` 作为组织架构真相源。

## 为什么

当前首页更像文件入口和模块摘要，对新人来说还不够像一页高浓度公司介绍。需要让用户一眼看懂项目是谁、现在打什么仗、谁负责什么、下一步看哪里。

## 范围

- 新增 `docs/ORG_MODEL.md`
- 首页重构为公司介绍 + 今日作战板
- 首页接入组织架构、核心系统、新人入职路径、当前风险
- 文档页语义分组同步改成组织语言
- 同步更新 `AGENTS`、`roadmap`、`current-state`、相关文档与测试

## 范围外

- 引入数据库或新的读模型
- 把首页做成项目管理后台
- 引入重型 lane / PR / branch / 线程池制度

## 约束

- Markdown 仍然是真相源
- 组织架构是职责镜头，不是官僚部门树
- `总经办` 吸收组织设计职责，不单列 HR
- 角色若重叠，优先合并，不为了完整而扩张

## 关联模块

- `apps/studio/src/modules/portal`
- `apps/studio/src/modules/docs`
- `apps/studio/src/modules/releases`
- `apps/studio/src/modules/tasks`
- `scripts/compounding_bootstrap/*`

## 计划

- 先把组织模型收成单一真相源
- 再把首页从目录入口改成公司介绍式总览
- 最后同步文档语义分组和相关文档

## 发布说明

这轮主要影响首页与文档入口，不涉及发布机制调整；上线前重点验收首页读感和组织卡片映射正确性。

## 验收标准

- 首页能清晰展示：我们是谁、今天在打什么仗、组织一览、核心系统、新人入职路径、当前风险
- 新增 `docs/ORG_MODEL.md`，并稳定映射到首页组织卡片
- 首页和文档页的语义入口改成组织语言，不再是偏目录式命名
- 组织文化明确体现“创业团队、高效、不大公司病”
- `pnpm lint`、`pnpm test`、`pnpm build`、`bootstrap:audit` 通过

## 风险

- 首页信息过多会重新变成目录页
- 角色说明若与现有职责文档重复，会出现双主源
- 组织卡片若太抽象，会降低新人理解速度

## 状态

done

## 更新痕迹

- 记忆：`memory/project/current-state.md`
- 索引：`code_index/module-index.md`, `code_index/dependency-map.md`
- 路线图：`memory/project/roadmap.md`
- 文档：`AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/PROJECT_RULES.md`, `docs/AI_OPERATING_MODEL.md`, `docs/ORG_MODEL.md`

## 复盘

组织真相源和首页组织语言已经建立，但“公司介绍页”仍不够像经营驾驶舱，这也是后续 task-004 接手的原因。
