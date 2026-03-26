---
title: OPERATOR_RUNBOOK
update_mode: generated
status: active
last_reviewed_at: 2026-03-26
source_of_truth: bootstrap/project_operator.yaml
related_docs:
  - AGENTS.md
  - docs/DEV_WORKFLOW.md
  - docs/AI_OPERATING_MODEL.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运维接入手册

## 使用规则

- canonical source：`bootstrap/project_operator.yaml`
- 真实密钥不入库；仓库里只保存 secret ref 名称和标准命令。
- Codex / Claude Code / Cursor / OpenCode 都必须通过同一份 contract 读取服务器、GitHub 和发布流。

## 项目

- 名称：`Compounding AI Operating System`
- 顶层备注：
  - 该文件只保存服务器访问面、GitHub 接入面和标准发布流的非密钥事实。
  - 真实密钥只放在 env、gh auth、ssh config 或外部 secret manager。
  - 人类扫读版由 docs/OPERATOR_RUNBOOK.md 承接；跨工具薄入口只负责把工具跳转到 AGENTS.md 与本文件。

## 服务器访问面

### local-preview

- 目的：`preview`
- 启用：`true`
- 传输：`local_process`
- 地址：`http://127.0.0.1:3011`
- 进入方式：`pnpm preview:start`
- 认证：`none`
- secret refs：无
- 启动：`pnpm preview:start`
- 停止：`pnpm preview:stop`
- 状态：`pnpm preview:status`
- 检查：`pnpm preview:check`
- 备注：
- 本地 preview channel；当前仓库由 scripts/local-runtime 目录管理。

### local-production

- 目的：`production`
- 启用：`true`
- 传输：`local_process`
- 地址：`http://127.0.0.1:3010`
- 进入方式：`pnpm prod:start`
- 认证：`none`
- secret refs：无
- 启动：`pnpm prod:start`
- 停止：`pnpm prod:stop`
- 状态：`pnpm prod:status`
- 检查：`pnpm prod:check`
- 备注：
- 本地 production runtime；是否真正在线以 prod 状态和 prod 检查命令为准。
## GitHub 接入面

- 启用：`false`
- provider：`github`
- 仓库：`未配置`
- 远端：`origin`
- 默认分支：`main`
- 认证：`gh_cli`
- secret refs：无
- 查看状态：`gh repo view`
- 同步：`git fetch --all --prune`
- 开 PR：`gh pr create --fill`
- 检查：`gh pr checks`
- required checks：无
- 备注：
  - 当前仓库未检测到 remote origin；接入 GitHub 后再补 owner、repo 和 required_checks。
  - 默认优先使用 gh auth / gh cli，而不是把 token 写进仓库。

## 标准发布流

- 基础 preflight：`pnpm preflight`
- task preflight：`pnpm preflight -- --taskId=t-xxx`
- preview prepare：`node --experimental-strip-types scripts/release/prepare-release.ts --ref HEAD --channel dev --primary-task <taskId>`
- preview accept：`node --experimental-strip-types scripts/release/accept-dev-release.ts --release <releaseId>`
- preview reject：`node --experimental-strip-types scripts/release/reject-dev-release.ts --release <releaseId>`
- 晋升 main：`git checkout main && git merge --no-ff <validated-branch>`
- 启动 production runtime：`pnpm prod:start`
- production status：`pnpm prod:status`
- production check：`pnpm prod:check`
- rollback：`node --experimental-strip-types scripts/release/rollback-release.ts --release <releaseId>`
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
