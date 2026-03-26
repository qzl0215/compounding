# 统一运维契约和跨工具入口

## 任务摘要

- 任务 ID：`task-069-operator-contract-and-cross-tool-entry`
- 短编号：`t-069`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  统一运维契约和跨工具入口
- 为什么现在：
  当前仓库已有发布流与 AI 契约，但缺少一层统一承接服务器访问、GitHub 接入和标准发布动作的项目级合同，导致不同工具只能靠零散文档和人工记忆接入。
- 承接边界：
  只新增 operator contract、生成/校验脚本、bootstrap/audit 接线和跨工具薄入口；不改真实密钥存放方式，不引入数据库，不改 Studio 页面。
- 完成定义：
  bootstrap/project_operator.yaml 成为唯一机读运维主源；OPERATOR_RUNBOOK 与 Claude/Cursor/OpenCode 薄入口可由脚本生成；audit 与静态校验会约束命令、secret ref 和入口一致性。

## 执行合同

### 要做

- 新增 `project_operator` schema/template/instance
- 新增 operator 资产生成与校验脚本
- 接入 bootstrap `attach / bootstrap / audit`
- 生成 `OPERATOR_RUNBOOK` 和跨工具薄入口
- 更新高频文档与测试

### 不做

- 不把真实 token、私钥或连接串入库
- 不新增服务器编排器或远程部署能力
- 不修改 `project_brief` 的边界职责
- 不改 Studio 读模型或页面

### 约束

- `AGENTS.md` 继续是唯一高频入口
- 真实密钥只放 env、`gh auth`、`ssh config` 或外部 secret manager
- 跨工具入口只能指向 canonical source，不能复制完整规则
- `project_operator` 只记录访问面、命令和 secret 名称，不记录真实 secret 值

### 关键风险

- `attach / bootstrap / audit` 接线容易漏掉新合同
- 生成入口文件若写死内容，后续会和 `AGENTS` 分叉
- `secret_refs` 校验若过宽，会把真实敏感值带进仓库

### 测试策略

- 为什么测：这轮同时扩 schema、bootstrap、静态校验和生成资产，必须锁住合同字段、入口一致性和 secret 安全边界。
- 测什么：schema 校验、bootstrap audit、operator 资产生成、命令存在性、secret ref 安全检查、跨工具入口一致性。
- 不测什么：不做真实 GitHub API 调用，不做远程服务器连通性测试，不做 Studio UI 回归。
- 当前最小集理由：优先用脚本级和 fixture 测试覆盖合同与生成逻辑，避免为了一个运维合同引入高成本端到端环境依赖。

## 交付结果

- 状态：doing
- 体验验收结果：
  `pnpm ai:generate-operator-assets`、`pnpm ai:validate-operator-contract`、`python3 -m unittest tests.test_bootstrap_scaffold_cli tests.test_ai_assets_cli`、`pnpm validate:static` 与 `pnpm validate:build` 已通过；`pnpm coord:review:run -- --taskId=t-069` 的 scope / lock / contract / architecture / test reviewer 全部通过，merge decision 仅因 `AGENTS.md` 与 `package.json` 属于核心文件而给出人工确认建议。
- 交付结果：
  已新增 `bootstrap/project_operator.yaml`、`schemas/project_operator.schema.yaml` 与 `templates/project_operator.template.yaml`，并补上 `scripts/ai/generate-operator-assets.ts`、`scripts/ai/validate-operator-contract.ts`、`scripts/ai/lib/operator-contract.ts` 和 `scripts/compounding_bootstrap/operator_contract.py`；当前仓库的本地 preview / production、GitHub 接入占位和标准发布流已统一进入 operator contract，`docs/OPERATOR_RUNBOOK.md`、`CLAUDE.md`、`OPENCODE.md` 与 `.cursor/rules/00-project-entry.mdc` 可由脚本生成，`bootstrap attach / bootstrap / audit` 以及静态门禁也已接入这份合同。
- 复盘：
  这类跨工具治理改动最容易失败的点不是 schema 本身，而是“又多写了一套说明书”；这轮真正保住复杂度的做法是把人类 runbook 和各工具入口都降成生成产物，只允许它们回指 `AGENTS.md` 与 `bootstrap/project_operator.yaml`，从根上避免多主源分叉。

## 当前模式

发布复盘

## 分支

`codex/task-069-operator-contract-and-cross-tool-entry`

## 关联模块

- `bootstrap/project_operator.yaml`
- `schemas/project_operator.schema.yaml`
- `templates/project_operator.template.yaml`
- `kernel/kernel_manifest.yaml`
- `scripts/compounding_bootstrap/`
- `scripts/ai/`
- `docs/OPERATOR_RUNBOOK.md`
- `CLAUDE.md`
- `OPENCODE.md`
- `.cursor/rules/00-project-entry.mdc`
- `package.json`
- `AGENTS.md`
- `docs/DEV_WORKFLOW.md`
- `docs/AI_OPERATING_MODEL.md`
- `memory/project/current-state.md`
- `memory/project/operating-blueprint.md`
- `memory/project/roadmap.md`
- `tests/`
- `tasks/queue/task-069-operator-contract-and-cross-tool-entry.md`

## 更新痕迹

- 记忆：updated current-state / operating-blueprint to record operator contract and cross-tool entry flow
- 索引：no change: 未更新
- 路线图：updated roadmap priority to include operator contract as landed infrastructure
- 文档：updated AGENTS / DEV_WORKFLOW / AI_OPERATING_MODEL and generated OPERATOR_RUNBOOK / thin entry files
