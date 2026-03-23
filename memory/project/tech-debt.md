---
title: TECH_DEBT
update_mode: append_only
status: active
last_reviewed_at: 2026-03-23
source_of_truth: memory/project/tech-debt.md
related_docs:
  - docs/PROJECT_RULES.md
  - memory/project/current-state.md
  - memory/project/roadmap.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 技术债

## 当前技术债

1. 发布模型仍是单机 `systemd + reverse proxy + symlink cutover`，没有多进程零停机或多机容灾
2. 发布管理页可读写 release registry，但真实生产反向代理环境还没做 live 验证
3. proposal engine 依赖 Ark/Volcano/OpenAI 环境变量；未配置时回退 deterministic rewrite
4. `scripts/ai/build-context.ts`、`generate-module-index.ts`、`validate-change-trace.ts`、`validate-task-git-link.ts` 仍偏轻量，trace 与相关性判断还可加精度
5. 当前没有 remote，`main` 直发生产只在本地仓库语义成立；远端分支和 release tag 推送未接通

## 删除计划

- 只保留能被 task、memory 或 release 直接消化的债务
- 新增临时层必须写清删除触发条件
- 若 `systemctl restart` 仍然影响当前流量，再评估更细粒度的 reload / socket activation

<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
