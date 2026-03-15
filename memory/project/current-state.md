---
title: CURRENT_STATE
doc_role: memory
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-15
source_of_truth: memory/project/roadmap.md
related_docs:
  - AGENTS.md
  - memory/project/roadmap.md
  - tasks/queue/task-001-repo-refactor.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Current State

## Project Snapshot

- 项目名称：Compounding AI Operating System
- 当前阶段：main 直发生产与可回滚发布模型收口
- 当前优先级：切到 main 直发生产，并补齐最小影响发布、回滚和本机管理入口。
- 成功定义：生产构建样式稳定，main 可直接发布；新版本先在后台 release 目录完成构建与检查，再通过 current 软链秒级切换；一旦改坏，可在本机或内网管理页 review 最近版本并快速回滚。
- 必须保护：AGENTS.md 是唯一主源，Git 文件即真相，关键改动先 review 再写入，不引入平行规则体系，发布失败不影响当前线上版本
- 运行边界：server-only

## Current Focus

- 修复生产构建 Tailwind 样式裁剪问题
- 把发布主线切到 `main = production`
- 落地 `releases/<id> + current + shared + registry.json`
- 提供本机/内网发布管理页与回滚入口

## Next Checkpoint

- `pnpm build`
- `pnpm test`
- `python3 scripts/init_project_compounding.py audit --config bootstrap/project_brief.yaml --target .`
- `node --experimental-strip-types scripts/release/prepare-release.ts --ref main`

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
