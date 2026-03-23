---
title: ADR_004_EXPERIENCE_COMPARABLE_ASSETS
doc_role: memory
update_mode: append_only
status: active
source_of_truth: tasks/queue/task-013-memory-assets-comparison-layer.md
related_docs:
  - memory/experience/README.md
  - docs/ASSET_MAINTENANCE.md
last_reviewed_at: 2026-03-17
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# ADR-004 经验可比较资产

## 背景

memory 已有 experience、ADR、project 等沉淀，但整体偏向“记录下来”。人和 AI 难以快速横向比较、识别模式、支撑后续判断。借鉴 gstack 的历史沉淀思路，需要让至少一类记忆升级为可比较资产。

## 决策

选择 **experience** 作为第一类可比较资产，新增 `memory/experience/experience-index.json`，由脚本从 `exp-*.md` 提取结构化字段，供横向扫、比较、复盘。

## 边界澄清

| 资产 | 职责 | 不承担 |
|------|------|--------|
| memory | 沉淀经验、决策、可复用判断；为人和 AI 提供“之前怎么做的、为什么” | 不承担 task 的 scope、验收；不承担 index 的代码导航 |
| task | 当前执行边界、scope、验收 | 不承载历史经验沉淀 |
| code_index | 模块/函数导航 | 不承载决策、经验或当前状态 |
| roadmap | 战略阶段、里程碑、优先级 | 不承载具体经验沉淀 |

## 经验索引结构

- 维护方式：`generated`
- 真相源：`memory/experience/exp-*.md`
- 生成脚本：`scripts/ai/generate-experience-index.ts`
- 字段：id、title、decision、reuse、related_docs、path

## 影响

- experience 可被快速横向扫，支持“重复出现 2 次以上”的升格判断
- AI 可基于索引做模式识别，而不必逐篇读全文
- 不引入数据库；索引是 experience 的投影，不制造新真相源

## 复用

若 ADR 或 project 类记忆后续也需要可比较，可复用同一“manifest 生成”模式，但本 ADR 仅覆盖 experience。
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
