# 把记忆系统升级为可比较资产

## 目标

让 `memory` 不再只是静态沉淀文档，而是逐步升级为可横向比较、可复盘、可为后续 agent 提供更高价值判断依据的认知资产。

## 为什么

当前仓库已经有 `experience`、`ADR`、项目状态、路线图和运营蓝图，但整体仍偏向“记录下来”。借鉴 `gstack` 的历史沉淀思路，下一步更值得做的是让这些记忆可对比、可回看、可直接支撑后续判断，而不是继续堆积文本。

## 范围

- 盘点当前 `memory` 中最有潜力做成可比较资产的内容
- 明确“沉淀记录”和“可比较资产”的边界
- 选择一类高价值记忆进行结构化升级方案设计
- 收口相关命名、索引与回写策略，避免与 task、roadmap、index 混写

## 范围外

- 不引入数据库、分析平台或复杂可视化系统
- 不把所有 memory 文档一次性结构化改造
- 不让 memory 反向承担 task 或 index 的职责

## 约束

- 继续保持 memory 轻量，不把它做成重型知识管理系统
- 记忆的升级必须提升判断价值，而不是只增加格式层
- 任何结构化都要服务于人和 AI 的后续使用，而不是为了“更系统”本身

## 关联模块

- `memory/experience/*`
- `memory/decisions/*`
- `memory/project/*`
- `code_index/*`
- `docs/AI_OPERATING_MODEL.md`

## 短编号

t-013

## 当前模式

发布复盘

## 分支

`codex/task-013-memory-assets-comparison-layer`

## 最近提交

`auto: branch HEAD`

## 交付收益

experience 可被快速横向扫，支持「重复出现 2 次以上」的升格判断；AI 可基于索引做模式识别，而不必逐篇读全文。

## 交付风险

若索引与 experience 正文不同步，会制造新的漂移；需在 experience 变更时记得重新生成。

## 一句复盘

选择 experience 作为第一类可比较资产，用 manifest 生成模式收口，不引入数据库。

## 计划

- 盘点当前 memory 里最值得升级的沉淀类型
- 明确 memory、task、index、roadmap 的职责边界
- 为一类高价值记忆设计可比较资产的最小落地方案

## 发布说明

本任务新增 ADR-004、generate-experience-index 脚本与 experience-index.json；experience 变更后需运行 `pnpm ai:generate-experience-index`。

## 验收标准

- 明确哪些记忆适合升级为可比较资产
- 至少形成一类高价值记忆的结构化升级方案
- memory 与 task、index、roadmap 的边界更清楚
- 不通过新增重平台来解决问题

## 风险

- 若边界没压清，memory 会继续和 task、index 重叠
- 若结构化过度，会把经验沉淀变成新的官僚负担
- 若只增加格式而没有比较价值，收益会很低

## 状态

done

## 更新痕迹

- 记忆：`memory/decisions/ADR-004-experience-comparable-assets.md`, `memory/experience/README.md`
- 索引：`no change: experience-index 独立于 code_index`
- 路线图：`no change: current priority unchanged`
- 文档：`tasks/queue/task-013-memory-assets-comparison-layer.md`

## 复盘

- 经验索引让「先记忆再升格」的候选判断有数据支撑，而不靠人脑记忆。
