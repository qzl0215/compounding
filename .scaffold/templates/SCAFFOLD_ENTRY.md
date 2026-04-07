# 脚手架初始化入口

本文档说明如何将 Compounding 脚手架接入新项目。

---

## 快速开始

将以下两个文件夹复制到新项目根目录：

```
.scaffold/          # 工具箱（含所有 AI 工具链）
.scaffold-internal/ # 项目配置（goals, tasks, skills 订阅）
```

---

## 入口文件追加

新项目接入后，需要在入口文件中追加脚手架说明。以下是需要在各入口文件中追加的内容：

### AGENTS.md 追加内容

将以下内容追加到 `AGENTS.md` 文件末尾：

```markdown
## 脚手架入口

本项目已接入 Compounding 脚手架：

- **工具箱**：`.scaffold/` 目录包含所有 AI 工具链
  - `.scaffold/scripts/ai/` — 生成、校验、扫描工具
  - `.scaffold/scripts/coord/` — 协调脚本（preflight, task, review）
  - `.scaffold/scripts/release/` — 发布脚本
  - `.scaffold/scripts/harness/` — Harness 脚本
  - `.scaffold/kernel/` — 状态机与内核配置
  - `.scaffold/schemas/` — JSON Schema 定义
  - `.scaffold/templates/` — 模板文件
  - `.scaffold/shared/` — 共享工具库
  - `.scaffold/resources/skills/` — Skills 工具箱
  - `.scaffold/studio/` — Studio UI
- **项目配置**：`.scaffold-internal/` 目录包含项目专属配置
  - `.scaffold-internal/memory/project/` — 目标与当前状态
  - `.scaffold-internal/memory/skills/` — Skills 订阅配置
  - `.scaffold-internal/tasks/queue/` — 任务队列
- **入口规则**：本文件（AGENTS.md）及 CLAUDE.md、OPENCODE.md 为协议入口

读取顺序：AGENTS.md → CLAUDE.md → .scaffold/kernel/ → .scaffold-internal/memory/project/
```

### CLAUDE.md 追加内容

将以下内容追加到 `CLAUDE.md` 文件末尾：

```markdown
## 项目脚手架

本项目使用 Compounding 脚手架：
- 工具箱：`.scaffold/`
- 项目配置：`.scaffold-internal/`
- 工具链命令：`pnpm ai:feature-context`, `pnpm preflight`, `pnpm validate:static`
```

### OPENCODE.md 追加内容

将以下内容追加到 `OPENCODE.md` 文件末尾：

```markdown
## 项目脚手架

本项目使用 Compounding 脚手架：
- 工具箱：`.scaffold/`
- 项目配置：`.scaffold-internal/`
- 工具链命令：`pnpm ai:feature-context`, `pnpm preflight`, `pnpm validate:static`
```

---

## 工作流程

完成入口文件追加后，可使用以下命令：

| 命令 | 说明 |
|------|------|
| `pnpm ai:create-task` | 开始新任务 |
| `pnpm preflight` | 预检查 |
| `pnpm validate:static` | 静态校验 |
| `pnpm validate:build` | 构建校验 |
| `pnpm ai:feature-context -- --surface=home` | AI feature 摘要 |

---

## 目录结构说明

### 整体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           新项目根目录                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐                              ┌─────────────────┐ │
│  │  .scaffold/     │  ← 便携工具箱                 │                 │ │
│  │  （可删除）      │    删除后项目只剩业务代码      │   业务代码目录   │ │
│  │                 │                              │   apps/, src/   │ │
│  └─────────────────┘                              │   等项目自身代码  │ │
│  ┌─────────────────┐                              │                 │ │
│  │  .scaffold-    │  ← 项目专属配置              └─────────────────┘ │
│  │  internal/      │    随项目迭代的状态数据                      │
│  │                 │                                                    │
│  └─────────────────┘                                                    │
│                                                                         │
│  AGENTS.md / CLAUDE.md / OPENCODE.md  ← 协议入口（人类 + AI 共同读取）   │
└─────────────────────────────────────────────────────────────────────────┘
```

### .scaffold/ 工具箱详细结构

#### kernel/ — 项目治理的核心契约定义

| 文件 | 用途说明 |
|------|---------|
| `kernel_manifest.yaml` | **能力包清单**：定义脚手架包含哪些能力包（protocol_pack, tooling_pack, ai_exec_pack 等），每个包包含哪些文件路径。Bootstrap 命令根据此文件决定复制哪些文件到新项目。 |
| `task-state-machine.yaml` | **Task 状态机**：定义 task 的生命周期状态（pending → in_progress → done → released）和状态转换规则。AI 通过此文件理解 task 状态如何流转。 |
| `release-state-machine.yaml` | **Release 状态机**：定义 release 的生命周期（dev → staging → prod → archived）和切换规则。发布流程通过此文件保证一致性。 |
| `derived-asset-contract.yaml` | **派生产物契约**：定义哪些文件是"派生的"（derived），哪些是"主真相"（source of truth）。防止 AI 把派生结果误当原始数据。 |

#### schemas/ — 所有配置的数据格式定义

| 文件 | 用途说明 |
|------|---------|
| `project_brief.schema.yaml` | **项目简报 Schema**：定义 `bootstrap/project_brief.yaml` 的数据结构，包含 project_name, kernel_version, adoption_mode 等字段的格式要求。 |
| `task-state-machine.schema.yaml` | **Task 状态机 Schema**：定义 task 状态机配置的 JSON 格式，用于校验状态机配置的合法性。 |
| `release-state-machine.schema.yaml` | **Release 状态机 Schema**：定义 release 状态机配置的 JSON 格式。 |
| `kernel_manifest.schema.yaml` | **能力包清单 Schema**：定义 kernel_manifest.yaml 自身的格式，确保能力包定义的一致性。 |
| `bootstrap_report.schema.yaml` | **Bootstrap 报告 Schema**：定义 `output/bootstrap/bootstrap_report.yaml` 的格式，用于记录 bootstrap 执行结果。 |
| `proposal.schema.yaml` | **提案 Schema**：定义 `output/proposals/*/proposal.yaml` 的格式，用于 AI 升级提案的结构化输出。 |
| `experience_promotion.schema.yaml` | **经验升格 Schema**：定义经验从临时存储升格到永久记录的格式要求。 |
| `project_operator.schema.yaml` | **项目操作者 Schema**：定义 operator 接入配置的格式。 |

#### templates/ — 配置文件的生成模板

| 文件 | 用途说明 |
|------|---------|
| `project_brief.template.yaml` | **项目简报模板**：新项目初始化时生成 `bootstrap/project_brief.yaml` 的模板，包含项目基本信息、kernel 版本、适配器类型等占位符。 |
| `project_operator.template.yaml` | **Operator 模板**：生成 `bootstrap/project_operator.yaml` 的模板，定义服务器的访问方式、GitHub 接入凭证等运维配置。 |
| `proposal.template.yaml` | **提案模板**：AI 生成升级提案时的结构化输出模板。 |
| `bootstrap_report.template.yaml` | **报告模板**：Bootstrap 执行完成后生成报告的模板。 |
| `SCAFFOLD_ENTRY.md` | **脚手架入口文档**：本文件。说明如何将脚手架接入新项目、如何追加入口文件段落。 |
| `scaffold_init_prompt.txt` | **简化提示词**：SCAFFOLD_ENTRY.md 的简化版本，便于 AI 快速读取关键信息。 |

#### scripts/ai/ — AI 驱动的自动化工具集

| 文件 | 用途说明 |
|------|---------|
| `create-task.ts` | **创建 Task**：通过命令行创建新的 structural/release task，自动生成 YAML frontmatter、task ID、关联治理信息。是进入 task 工作流的入口。 |
| `build-context.ts` | **构建上下文**：为 AI 生成代码前准备上下文信息，包括当前代码结构、最近改动、相关文件等。 |
| `feature-context.ts` | **Feature 上下文**：生成面向人类的项目逻辑态势图，用于首页和任务页展示。输出结构化的 feature 合同供 UI 消费。 |
| `preflight-summary.ts` | **预检查摘要**：对 `pnpm preflight` 的输出进行摘要，提取关键警告和建议。 |
| `validate-static-summary.ts` | **静态校验摘要**：对 `pnpm validate:static` 的输出进行摘要。 |
| `validate-build-summary.ts` | **构建校验摘要**：对 `pnpm validate:build` 的输出进行摘要。 |
| `command-gain.ts` | **Token 效率分析**：分析 AI 命令的 token 消耗和产出比，帮助优化 AI 使用成本。 |
| `lib/cli-kernel.js` | **CLI 核心库**：所有 AI 工具的共享 CLI 基础设施，处理参数解析、标准输出/错误输出。 |
| `lib/task-template.js` | **Task 模板渲染**：创建 task 时渲染 YAML frontmatter 模板的共享逻辑。 |
| `lib/task-resolver.ts` | **Task 解析器**：根据 task ID 或文件路径解析 task 信息的共享逻辑。 |
| `lib/retro-candidates.ts` | **复盘候选**：从 raw trace 中提取重复出现的 blocker，生成复盘候选列表供人工升格。 |
| `lib/summary-harness.ts` | **摘要引擎**：通用摘要生成逻辑，支持多种摘要格式和配置。 |
| `lib/summary-profiles.ts` | **摘要配置**：定义不同场景下的摘要格式配置（preflight, review, build 等）。 |
| `lib/change-policy.ts` | **变更策略**：定义哪些改动需要人工 review，哪些可以自动应用。 |

#### scripts/coord/ — 协调脚本集

| 文件 | 用途说明 |
|------|---------|
| `preflight.ts` | **预检查** ⭐：每次改动前必跑的检查脚本。检查 git 状态、task 状态、门禁条件，输出决策卡。是进入 structural/release 工作的守门员。 |
| `task.ts` | **Task 管理**：管理 task 的生命周期——创建、更新状态、关联 companion 文件。是 task 工作流的入口。 |
| `review.ts` | **Code Review**：辅助 AI 进行 code review，输出 review 意见和风险评估。 |
| `lib/` | **协调脚本共享库** |

#### scripts/release/ — 发布脚本集

| 文件 | 用途说明 |
|------|---------|
| `prepare-release.ts` | **准备发布**：创建新的 release 记录，设置初始状态。 |
| `accept-dev-release.ts` | **接受 Dev Release**：将 dev release 升格为 staging/prod release。 |
| `reject-dev-release.ts` | **拒绝 Dev Release**：标记 dev release 为 rejected，保留拒绝原因。 |
| `switch-release.ts` | **切换 Release**：切换当前激活的 release。 |
| `rollback-release.ts` | **回滚 Release**：将 release 回滚到上一个稳定版本。 |

#### scripts/harness/ — 测试 Harness 脚本

用于结构化测试和验收测试的脚本集合。

#### scripts/local-runtime/ — 本地运行时脚本

| 文件 | 用途说明 |
|------|---------|
| 本地运行时脚本 | 启动和管理本地开发/预览环境的脚本。 |

#### scripts/compounding_bootstrap/ — Bootstrap 引擎

| 文件 | 用途说明 |
|------|---------|
| `bootstrap.py` | **Bootstrap 主逻辑**：将脚手架安装到新项目的主脚本。复制文件、生成配置、初始化项目结构。 |
| `attach.py` | **Attach 子命令**：将脚手架附加到已有项目，生成 project_brief.yaml 和 operator contract。 |
| `audit.py` | **Audit 子命令**：审计已有项目的脚手架接入情况，输出缺失和冲突项。 |
| `engine.py` | **命令引擎**：解析命令行参数，分发到对应的子命令（bootstrap, attach, audit 等）。 |
| `packs.py` | **能力包管理**：加载 kernel_manifest.yaml，解析能力包定义，计算依赖关系。 |
| `scaffold_assets.py` | **脚手架资产管理**：定义脚手架包含哪些资产，负责文件复制逻辑。 |
| `config_resolution.py` | **配置解析**：解析项目配置文件，解决配置继承和覆盖关系。 |
| `operator_contract.py` | **Operator 契约**：生成和管理 operator contract，确保运维配置的一致性。 |
| `yaml_io.py` | **YAML 读写**：统一的 YAML 文件读写工具。 |
| `defaults.py` | **默认配置**：定义各种默认路径、文件名、模式等。 |
| `catalog.py` | **资产目录**：维护脚手架资产清单。 |
| `managed_blocks.py` | **托管块管理**：处理 AGENTS.md 等文件中的 managed block（可自动更新的部分）。 |
| `proposal.py` | **提案生成**：生成 AI 升级提案。 |
| `proposal_engine.py` | **提案引擎**：执行提案生成和应用的引擎。 |
| `proposal_generation.py` | **提案内容生成**：生成具体的升级提案内容。 |
| `proposal_support.py` | **提案支持**：辅助提案生成的工具函数。 |
| `renderers_index.py` | **索引渲染**：生成各种索引页面的渲染器。 |
| `renderers_base_docs.py` | **基础文档渲染**：渲染基础文档的渲染器。 |
| `renderers_experience_docs.py` | **经验文档渲染**：渲染经验相关文档的渲染器。 |
| `repo_scan.py` | **仓库扫描**：扫描项目结构，收集资产信息。 |
| `schema_validation.py` | **Schema 校验**：校验 YAML 配置是否符合 Schema 定义。 |
| `module.md` | **模块说明**：本模块的说明文档。 |

#### shared/ — 跨模块共享的工具库

| 文件 | 用途说明 |
|------|---------|
| `task-state-machine.ts` | **Task 状态机解析器**：解析 `kernel/task-state-machine.yaml`，提供状态转换判断、状态查询等功能。 |
| `release-state-machine.ts` | **Release 状态机解析器**：解析 `kernel/release-state-machine.yaml`，提供 release 状态转换逻辑。 |
| `derived-asset-contract.ts` | **派生产物契约解析器**：解析派生产物契约，校验文件语义归属。 |
| `simple-yaml.ts` | **YAML 解析器**：轻量级 YAML 解析工具，不依赖外部库。 |
| `project-judgement.ts` | **项目判断**：根据项目状态判断当前所处的阶段（初始化、迭代、发布等）。 |
| `project-judgement-live.ts` | **运行时项目判断**：在运行时动态判断项目状态，输出决策建议。 |
| `release-registry.ts` | **Release 注册表**：管理所有 release 记录的注册表，提供查询和投影功能。 |
| `task-contract.ts` | **Task 契约**：解析和校验 task 的 YAML frontmatter。 |
| `github-surface.ts` | **GitHub 接口**：封装 GitHub API，提供 repo、PR、issue 等操作接口。 |
| `github-surface-runtime.ts` | **GitHub 运行时**：GitHub 接口的运行时配置和凭证管理。 |
| `feature-context.ts` | **Feature 上下文**：生成 feature 级别的上下文信息，供首页和任务页展示。 |
| `git-changed-files.ts` | **Git 变更文件**：从 git 历史中提取变更文件列表。 |
| `task-cost.ts` | **Task 成本计算**：估算 task 的 AI 执行成本（token 消耗）。 |
| `learning-signals.ts` | **学习信号**：从执行过程中提取可学习的信号，供经验升格使用。 |
| `ai-efficiency.ts` | **AI 效率分析**：分析 AI 命令的效率，提供优化建议。 |
| `branch-cleanup.ts` | **分支清理**：自动清理已合并的分支。 |
| `governance-gap-contract.ts` | **治理差距契约**：定义治理差距（governance gap）的结构和处理流程。 |
| `change-packet.ts` | **变更包**：封装多个文件的变更为一个可审查的变更包。 |
| `token-format.ts` | **Token 格式**：处理 token 计数和格式化。 |
| `task-identity.ts` | **Task 身份**：管理 task 的唯一标识（ID、标题、slug 等）。 |
| `module-feature-contract.ts` | **模块 Feature 契约**：定义模块级别的 feature 合同。 |
| `harness/` | **Harness 子系统**：测试 harness 的共享组件。 |

#### resources/skills/ — Skills 工具箱（可复用最佳实践）

| 文件 | 用途说明 |
|------|---------|
| `skill-index.json` | **Skills 索引**：所有可用 Skills 的索引，包含 ID、名称、描述、来源。AI 根据此索引匹配适合当前上下文的 Skill。 |
| `subscriptions.json` | **订阅配置** ⭐：项目级 Skills 订阅状态。决定哪些 Skills 在项目中启用、触发条件是什么。 |
| `coding-standards.md` | **编码规范 Skill**：Immutability-first 编码风格指导，包含文件组织、错误处理、代码质量指南。 |
| `security-checklist.md` | **安全检查清单 Skill**：OWASP Top 10、认证、输入校验等安全相关的检查清单。 |
| `tdd-workflow.md` | **TDD 工作流 Skill**：红-绿-重构循环的测试驱动开发流程，80%+ 覆盖率要求。 |
| `planning-before-coding.md` | **编码前规划 Skill**：硬性门控——设计批准前不开始实现。 |
| `systematic-debugging.md` | **系统调试 Skill**：5 步系统调试方法论。 |
| `anti-give-up.md` | **不放弃 Skill**：防止 AI 在困难问题时放弃的激励策略。 |
| `session-memory.md` | **会话记忆 Skill**：从会话中提取可复用模式并持久化。 |
| `continuous-learning.md` | **持续学习 Skill**：从执行过程中提取经验改进。 |
| `frontend-design-principles.md` | **前端设计原则 Skill**：设计先于代码——在写前端代码前先建立审美方向。 |
| `design-system-generator.md` | **设计系统生成器 Skill**：从产品描述生成完整设计系统（颜色、字体、模式）。 |
| `lookup.py` | **Skill 查询器**：在 planning 阶段自动查询匹配的 advisory skills，在 executing 阶段根据上下文动态注入。 |

#### studio/ — Studio UI（用户操作界面）

| 路径 | 用途说明 |
|------|---------|
| `src/app/` | **Next.js App Router**：页面路由定义 |
| `src/app/page.tsx` | **首页**：项目逻辑态势图、可点击的逻辑结构图 |
| `src/app/tasks/page.tsx` | **任务页**：任务列表、task 详情 |
| `src/app/releases/page.tsx` | **发布页**：Release 状态、发布历史 |
| `src/app/skills/page.tsx` | **Skills 管理页**：查看和配置 Skills 订阅 |
| `src/app/api/` | **API 路由**：后端 API 端点 |
| `src/components/` | **UI 组件**：Badge、Card、PageHeader 等通用组件 |
| `src/modules/` | **功能模块**：tasks、releases、skills、delivery 等模块的业务逻辑 |
| `src/modules/tasks/` | **任务模块**：任务管理的前端逻辑 |
| `src/modules/releases/` | **发布模块**：发布管理的前端逻辑 |
| `src/modules/skills/` | **Skills 模块**：Skills 配置的前端逻辑 |
| `src/modules/delivery/` | **交付模块**：交付流程的前端逻辑 |

---

### .scaffold-internal/ 项目配置详细结构

#### memory/project/ — 项目级状态记忆

| 文件 | 用途说明 |
|------|---------|
| `goals.md` | **项目目标** ⭐：定义项目的当前阶段、优先级、里程碑成功标准。当前里程碑是什么、要达成什么目标。 |
| `current-state.md` | **当前状态** ⭐：项目的运营快照——本地入口状态、当前焦点、阻塞点、推荐校验顺序、关键冻结项、下一步检查点。 |
| `tech-debt.md` | **技术债记录**：已识别的技术债列表、优先级、偿还计划。 |

#### memory/skills/ — Skills 配置

| 文件 | 用途说明 |
|------|---------|
| `subscriptions.json` | **订阅配置** ⭐：项目级 Skills 订阅状态。AI 根据此配置决定启用哪些 Skills。包含 Skill ID、订阅状态（subscribed/paused/mandatory）、触发模式。 |

#### tasks/queue/ — Task 队列

| 文件 | 用途说明 |
|------|---------|
| `task-*.md` | **Task 文件** ⭐：每个 structural/release task 一个文件，包含 YAML frontmatter（task_id, type, status, parent_plan, delivery_track 等）和任务正文。 |
| `.gitkeep` | **目录占位符**：保证空目录被 git 跟踪。 |

#### tasks/templates/ — Task 模板

| 文件 | 用途说明 |
|------|---------|
| `task-template.md` | **Task 模板**：创建新 task 时使用的模板，包含必填的 YAML frontmatter 字段和任务正文结构。 |

---

## Skills 订阅配置详解

Skills 是可复用最佳实践，通过 `.scaffold-internal/memory/skills/subscriptions.json` 配置启用。

```json
{
  "skills": {
    "coding-standards": {
      "status": "subscribed",
      "invoke_mode": "inline",
      "reason": "基础规范，Token轻"
    },
    "security-checklist": {
      "status": "subscribed",
      "invoke_mode": "mandatory",
      "force_when": [
        { "type": "pattern", "patterns": ["auth", "password", "token", "api"] }
      ],
      "reason": "安全关键，force触发"
    }
  }
}
```

| 状态 | 说明 |
|------|------|
| `subscribed` | 已订阅，AI 会自动使用 |
| `paused` | 暂停，按需手动启用 |
| `mandatory` | 强制，命中触发模式时必须使用 |

---

## 注意事项

1. **删除 .scaffold/ 后项目仍能独立运行** — `.scaffold/` 是工具箱，删除后项目只剩业务代码（apps/, src/ 等），不影响项目本身功能。

2. **.scaffold-internal/ 是项目专属状态** — 随项目迭代积累，包含 goals、current-state、tasks 队列等，是项目的上下文记忆。

3. **Skills 是工具箱的一部分** — Skills 定义（.md 文件）在 `.scaffold/resources/skills/`，随脚手架升级。订阅配置在 `.scaffold-internal/memory/skills/`，每个项目独立配置。

4. **入口文件追加由 AI 自动完成** — AI 读取本文件后，会自动将脚手架入口段落追加到 AGENTS.md / CLAUDE.md / OPENCODE.md。

5. **Bootstrap 命令入口不变** — `python3 scripts/init_project_compounding.py bootstrap --target /path/to/project` 的用法保持不变，只是内部复制的文件路径变了。
