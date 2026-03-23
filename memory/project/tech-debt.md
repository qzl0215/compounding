---
title: TECH_DEBT
update_mode: append_only
status: active
last_reviewed_at: 2026-03-16
source_of_truth: memory/project/tech-debt.md
related_docs:
  - docs/PROJECT_RULES.md
  - memory/project/current-state.md
  - memory/project/roadmap.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 技术债

## 当前技术债

1. 当前发布模型仍是单机 `systemd + reverse proxy + symlink cutover` 骨架；还没有多进程零停机或多机容灾能力
2. 本机/内网发布管理页可读写 release registry，但还缺少真实生产反向代理环境的 live 验证
3. proposal engine 仍依赖 Ark/Volcano/OpenAI 环境变量；未配置时会回退到 deterministic rewrite
4. `scripts/ai/build-context.ts`、`generate-module-index.ts`、`validate-change-trace.ts` 与 `validate-task-git-link.ts` 仍偏轻量，后续可继续提高相关性判断与 trace 精度
5. 当前没有 remote，`main` 直发生产只在本地仓库语义上成立；远端分支和 release tag 推送仍需后续接通

## 删除计划

- 任何仍然保留的 legacy 文本或兼容路径，都要在下一轮重构中删除或收口
- 任何新增临时层都必须写清删除触发条件
- 若后续验证 `systemctl restart` 对当前流量影响仍偏大，再评估更细粒度的 reload / socket activation 策略

<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
