---
title: OPERATOR_RUNBOOK
update_mode: generated
status: active
last_reviewed_at: 2026-04-06
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
- 模式：`ai_upgrade`
- adapter：`node_service`
- profile：`full_ai_dev`
- required packs：`protocol_pack`、`operator_pack`、`ai_exec_pack`、`tooling_pack`
- 顶层备注：
  - 该文件只保存服务器访问面、GitHub 接入面和标准发布流的非密钥事实。
  - 任务编排 contract 明确了 canonical state machine、主命令与 override 命令。
  - 真实密钥只放在 env、gh auth、ssh config 或外部 secret manager。
  - 人类扫读版由 docs/OPERATOR_RUNBOOK.md 承接；跨工具薄入口只负责把工具跳转到 AGENTS.md 与本文件。

## 推荐命令

- install：`pnpm install`
- dev：`pnpm dev`
- build：`pnpm build`
- test：`pnpm test`
- bootstrap doctor：`python3 scripts/init_project_compounding.py doctor --target .`
- bootstrap attach：`python3 scripts/init_project_compounding.py attach --target .`
- bootstrap audit：`python3 scripts/init_project_compounding.py audit --target .`
- bootstrap proposal：`python3 scripts/init_project_compounding.py proposal --target .`
- 默认 preflight 摘要：`pnpm ai:preflight:summary`
- 原始 preflight gate：`pnpm preflight`
- 原始 task preflight gate：`pnpm preflight -- --taskId=t-xxx`
- create task：`pnpm coord:task:create -- --taskId=t-xxx --summary=\"中文直给概述\" --why=\"为什么现在\"`
- task transition：`pnpm coord:task:transition -- --taskId=t-xxx --event=block --reason=\"说明原因\"`
- review：`pnpm coord:review:run -- --taskId=t-xxx`

## Task Orchestration

- canonical state machine：`kernel/task-state-machine.yaml`
- companion schema：`4`
- create：`pnpm coord:task:create -- --taskId=t-xxx --summary=\"中文直给概述\" --why=\"为什么现在\"`
- start：`pnpm coord:task:start -- --taskId=t-xxx`
- handoff：`pnpm coord:task:handoff -- --taskId=t-xxx`
- review：`pnpm coord:review:run -- --taskId=t-xxx`
- override transition：`pnpm coord:task:transition -- --taskId=t-xxx --event=<event> --reason=\"说明原因\"`
- canonical fields：`machine.state_id`、`machine.mode_id`、`machine.delivery_track`、`machine.blocked_from_state`、`machine.resume_to_state`、`machine.blocked_reason`、`machine.last_transition`
- compatibility aliases：`pnpm coord:check:pre-task -- --taskId=t-xxx`
- 备注：
  - 任务 canonical state 只写 companion.machine；task 正文与 release registry 只做派生展示或兼容读取。
  - block / resume / replan / abandon 只能通过 override_transition 触发，且必须带 reason。
  - 新 task 默认 create_task -> planning，delivery_track 默认 undetermined。
  - phase-1 harness parity ledger 的校验入口是 `pnpm harness:parity:check`；需要执行场景验证时可用 `pnpm harness:parity:verify`。

## 三模式入口

- `cold_start`：新项目冷启动
  - 推荐命令：`python3 scripts/init_project_compounding.py bootstrap --target . --mode=cold_start`
  - 适用：空仓或新仓，先装协议层、operator 契约和 repo-local AI 入口。
- `normalize`：老项目规范化
  - 推荐命令：`python3 scripts/init_project_compounding.py attach --target . --mode=normalize`
  - 适用：已有业务代码，但还没有统一协议、operator contract 和 AI 入口。
- `ai_upgrade`：老项目 AI 底座升级
  - 推荐命令：`python3 scripts/init_project_compounding.py attach --target . --mode=ai_upgrade`
  - 先自检：`python3 scripts/init_project_compounding.py doctor --target . --mode=ai_upgrade` / `python3 scripts/init_project_compounding.py audit --target .`
  - 适用：项目已准备长期按 AI feature 流开发，需要 preflight/task/review 与 summary harness。

## 老项目接入 checklist

- 先跑 `python3 scripts/init_project_compounding.py doctor --target .`，确认 `recommended_mode`、`adapter_id`、`required_packs`、`ready_for_ai_iteration`。
- 第一轮优先 `python3 scripts/init_project_compounding.py attach --target . --mode=normalize`。
- 跑 `python3 scripts/init_project_compounding.py audit --target .`，确认 `AGENTS.md`、`bootstrap/project_brief.yaml`、`bootstrap/project_operator.yaml`、`docs/OPERATOR_RUNBOOK.md`、`CLAUDE.md`、`OPENCODE.md`、`.cursor/rules/00-project-entry.mdc` 对齐。
- 跑 `python3 scripts/init_project_compounding.py proposal --target .`，先看提案再决定是否应用。
- 只有 `normalize` 通过且 `ready_for_ai_iteration=true` 时，再升级 `ai_upgrade`。
- 升级后跑 `pnpm preflight -- --taskId=t-xxx` 和 `pnpm preflight -- --taskId=t-xxx`。
- 验收：`python3 scripts/init_project_compounding.py doctor --target . --mode=ai_upgrade` 仍返回 `ready_for_ai_iteration=true`。

## 新项目 cold_start checklist

- 先跑 `python3 scripts/init_project_compounding.py doctor --target .`。
- 直接 `python3 scripts/init_project_compounding.py bootstrap --target . --mode=cold_start`。
- 如需补齐入口，再跑 `node --experimental-strip-types scripts/ai/generate-operator-assets.ts`。
- 跑 `python3 scripts/init_project_compounding.py audit --target .`。
- 只有项目真的需要 AI 深度迭代时，再进入 `ai_upgrade`。
- 验收：`doctor` 能明确推荐模式，`bootstrap` 生成的协议 / 入口文件可读可用，后续可平滑升到 `normalize` 或 `ai_upgrade`。

## AI 默认入口

- 默认 feature 上下文：`pnpm ai:feature-context -- --surface=home`
- 带 task 的 feature 上下文：`pnpm ai:feature-context -- --taskPath=tasks/queue/task-xxx.md`
- 默认摘要链：`pnpm ai:preflight:summary` / `pnpm ai:diff:summary` / `pnpm ai:tree:summary` / `pnpm ai:find:summary -- --query=keyword` / `pnpm ai:read:summary -- --path=memory/project/current-state.md`
- 原始回退链：`pnpm preflight` / `git diff` / `rg --files --hidden` / `rg -n --hidden keyword` / `sed -n '1,200p' memory/project/current-state.md`
- 看当前令牌效率：`pnpm ai:command-gain --json`
- 默认先看 feature packet 里的 `Project Judgement` 和 `Default Loop`，再动手改代码。

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
  - 接入前先运行 GitHub 接入摘要命令，只看本地还差哪一步，不直接猜 owner/repo。
  - 最小接入顺序固定为：配置 `origin` -> `git push -u origin main` -> 为活跃 task branch 建 upstream -> 回写 owner/repo/required_checks 并启用 `github_surface.enabled`。
  - 默认优先使用 gh auth / gh cli，而不是把 token 写进仓库。

## GitHub 接入准备

- 本地现状先跑：`pnpm ai:github-surface:summary`
- 最小接入顺序：
  - 配置 `origin` remote
  - 执行 `git push -u origin main`
  - 为活跃 task 分支执行 `git push -u origin codex/task-xxx`
  - 在 `bootstrap/project_operator.yaml` 中补齐 owner/repo/required_checks 并开启 `github_surface.enabled`
- 当前 contract 仍缺 owner/repo。
- 当前 contract 仍未启用 GitHub surface。
- 当前 required_checks 仍为空。

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

## Agent Shortcut

- 优先使用 preflight 摘要：`pnpm ai:preflight:summary`
  - 适用场景：改动前想快速确认 gate 结果；structural 或 release 场景继续补 -- --taskId=t-xxx
  - 原因：保留 preflight 判定语义，但把 blocker、note 和 retro hint 压成短摘要，失败时保留 raw tee
  - 工具面：`codex`、`claude`、`cursor`、`opencode`
- 优先使用静态校验摘要：`pnpm ai:validate:static:summary`
  - 适用场景：想看 validate:static 的关键信号，而不是整段脚本输出
  - 原因：只保留失败项、错误模式和脚本步骤，减少 lint 与 validator 噪音
  - 工具面：`codex`、`claude`、`cursor`、`opencode`
- 优先使用构建校验摘要：`pnpm ai:validate:build:summary`
  - 适用场景：想看 test/build/audit 的结果摘要，而不是整段构建日志
  - 原因：聚焦失败步骤与关键错误，避免把成功日志整段塞进上下文
  - 工具面：`codex`、`claude`、`cursor`、`opencode`
- 优先使用 review 摘要：`pnpm ai:review:summary -- --taskId=t-xxx`
  - 适用场景：需要看 review 结论、失败 reviewer 和 merge decision
  - 原因：保留 review contract，但把 reviewer 输出收成短摘要并统计 adoption
  - 工具面：`codex`、`claude`、`cursor`、`opencode`
- 优先使用 preview 健康摘要：`pnpm ai:preview:summary`
  - 适用场景：需要确认本地 preview 运行态，而不是看完整健康检查 JSON
  - 原因：直接给出 preview 状态、端口、drift 与失败原因，并统计 shortcut adoption
  - 工具面：`codex`、`claude`、`cursor`、`opencode`
- 优先使用 production 健康摘要：`pnpm ai:prod:summary`
  - 适用场景：需要确认本地 production 运行态，而不是看完整健康检查 JSON
  - 原因：直接给出 production 状态、端口、drift 与失败原因，并统计 shortcut adoption
  - 工具面：`codex`、`claude`、`cursor`、`opencode`
- 优先使用 GitHub 接入摘要：`pnpm ai:github-surface:summary`
  - 适用场景：需要确认 remote / upstream / owner / repo / required_checks 还差哪一步
  - 原因：把 GitHub 接入缺口压成单页摘要，避免在远端未配置时来回查 git 与 operator contract
  - 工具面：`codex`、`claude`、`cursor`、`opencode`
- 优先使用改动摘要：`pnpm ai:diff:summary`
  - 适用场景：需要看当前变更范围和主要改动文件，而不是整段 git diff
  - 原因：聚焦文件变更数、增删行和主要改动文件，减少 diff 噪音
  - 工具面：`codex`、`claude`、`cursor`、`opencode`
- 优先使用仓结构摘要：`pnpm ai:tree:summary`
  - 适用场景：需要快速了解仓库结构和热点目录，而不是展开整段文件列表
  - 原因：聚焦目录分布、文件类型和少量代表路径，减少读仓噪音
  - 工具面：`codex`、`claude`、`cursor`、`opencode`
- 优先使用查找摘要：`pnpm ai:find:summary -- --query=keyword`
  - 适用场景：需要找某个标识符、模块或文档线索，而不是直接把整段 rg 输出塞进上下文
  - 原因：聚焦命中总数、命中文件和代表性命中行，减少搜索噪音
  - 工具面：`codex`、`claude`、`cursor`、`opencode`
- 优先使用读文件摘要：`pnpm ai:read:summary -- --path=memory/project/current-state.md`
  - 适用场景：需要先了解文件结构和关键段落，而不是直接展开整份文件
  - 原因：对 module/task/markdown/code/json/yaml 做结构摘要，信息不足时再回退原文
  - 工具面：`codex`、`claude`、`cursor`、`opencode`
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
