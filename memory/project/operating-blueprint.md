---
title: OPERATING_BLUEPRINT
doc_role: planning
update_mode: manual
owner_role: PMO
status: active
source_of_truth: memory/project/roadmap.md
related_docs:
  - AGENTS.md
  - memory/project/roadmap.md
  - memory/project/current-state.md
  - tasks/queue/task-001-repo-refactor.md
last_reviewed_at: 2026-03-16
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 当前里程碑

强化运行态状态解释与告警体验

## 关键子目标

### 运行态状态模型收口

- 发布标准：
  - 明确服务未启动、版本漂移、端口异常、状态失真的状态定义
  - 页面、状态接口和运行时脚本对同一问题的命名一致
- 关联任务：
  - `tasks/queue/task-012-runtime-status-ux-hardening.md`

### 页面告警与下一步动作

- 发布标准：
  - `/releases` 能直接说明当前状态和下一步动作
  - 首页风险区能压缩展示关键运行态风险
  - 非技术用户无需读日志即可理解多数常见问题
- 关联任务：
  - `tasks/queue/task-012-runtime-status-ux-hardening.md`

### 运行态解释与发布链一致

- 发布标准：
  - `dev` 预览、production 与 release registry 的状态语义一致
  - 页面状态不会与本地运行时脚本、release registry 再次分叉
  - 告警语义能直接指向重启、重切换、回滚或继续修复等下一步动作
- 关联任务：
  - `tasks/queue/task-012-runtime-status-ux-hardening.md`

## 当前阻塞

- 当前无结构性阻塞；关键在于用最少的状态模型把最常见的运行态问题说清楚，而不是继续堆更多技术细节。

## 下一检查点

- 明确运行态状态模型与页面告警表达
- 选出首页风险区与 `/releases` 的最佳分工
- 让关键运行态问题都能直接指向下一步动作

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
