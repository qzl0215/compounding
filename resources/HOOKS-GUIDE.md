# Hooks深度整合指南

> 理解每个插件何时触发、如何控制、最大化价值

---

## 核心概念：Hooks vs Skills

| 机制 | 触发方式 | 控制方式 |
|------|----------|----------|
| **Hooks** | 事件自动触发（不可见） | 配置文件/环境变量 |
| **Skills** | Agent判断是否调用（可见） | 描述触发条件 |

---

## 1. ECC (everything-claude-code)

### Hooks清单（全部自动触发）

| 阶段 | Hook | 作用 | 控制方式 |
|------|------|------|----------|
| PreToolUse | `pre:bash:auto-tmux-dev` | 自动创建tmux开发环境 | `ECC_HOOK_PROFILE=minimal`禁用 |
| PreToolUse | `pre:bash:git-push-reminder` | git push前提醒 | `ECC_DISABLED_HOOKS=pre:bash:git-push-reminder` |
| PostToolUse | `post:edit:design-quality-check` | 编辑后设计质量检查 | `ECC_HOOK_PROFILE=minimal`禁用 |
| PostToolUse | `post:quality-gate` | 质量门禁 | `ECC_HOOK_PROFILE=minimal`禁用 |
| Stop | `stop:evaluate-session` | 会话评估+模式提取 | `ECC_SKIP_OBSERVE=1`禁用 |
| Stop | `stop:session-end` | 会话持久化 | 无法禁用（核心功能） |

### 控制命令

```bash
# 严格模式（全部启用）
export ECC_HOOK_PROFILE=strict

# 标准模式（默认）
export ECC_HOOK_PROFILE=standard

# 最小模式（只保留核心）
export ECC_HOOK_PROFILE=minimal

# 禁用特定hook
export ECC_DISABLED_HOOKS=pre:bash:git-push-reminder,post:edit:console-warn
```

### 何时启用/禁用

```
✅ 启用ECC hooks场景:
- 大型项目需要质量门禁
- 需要TDD流程监督
- 需要会话记忆

❌ 禁用ECC hooks场景:
- 快速原型/一次性任务
- 不想被打断的探索性工作
- 调试时hook干扰排查
```

---

## 2. Superpowers

### Hooks清单

| 阶段 | Hook | 触发条件 | 作用 |
|------|------|----------|------|
| SessionStart | `session-start` | startup/clear/compact | 注入using-superpowers skill |

### 核心机制

Superpowers的skills不是自动触发，而是**通过SessionStart注入的skill内容让Agent自主判断**。

```
SessionStart → 注入using-superpowers.md → Agent根据规则自主判断是否调用Skill
```

### 何时启用/禁用

```
✅ 启用Superpowers场景:
- 复杂软件工程项目
- 需要"先规划再编码"的工作
- 需要TDD铁律监督

❌ 禁用Superpowers场景:
- 简单脚本/单行命令
- Agent过于保守/规划过度时
- 快速修复已知问题
```

### 禁用方式

```bash
# 注释掉hooks.json中的SessionStart hook
# 或设置环境变量让hook脚本提前退出
export SUPERPOWERS_DISABLED=1
```

---

## 3. Claude-Mem

### 5个Lifecycle Hooks

| 阶段 | 触发条件 | 作用 |
|------|----------|------|
| **SessionStart** | startup/clear/compact | 注入历史timeline |
| **UserPromptSubmit** | 每次用户提交prompt | 初始化session+语义注入 |
| **PostToolUse** | 每次工具使用 | 记录observation到SQLite/Chroma |
| **Stop** | 120s超时 | 生成session摘要 |
| **SessionEnd** | 1.5s超时 | 清理会话 |

### Context注入逻辑

```
SessionStart → 读取最近sessions → 注入Timeline markdown
UserPromptSubmit → Chroma向量搜索 → 注入相关observations
```

### 控制命令

```bash
# 完全禁用（不跟踪任何内容）
export CLAUDE_MEM_DISABLED=1

# 禁用语义注入（只记录不搜索）
export CLAUDE_MEM_SEMANTIC_INJECT=false

# 排除特定项目
export CLAUDE_MEM_EXCLUDED_PROJECTS="~/tmp/*,**/playground/**"

# 控制timeline长度
export CLAUDE_MEM_CONTEXT_OBSERVATIONS=20  # 展示20条observations
export CLAUDE_MEM_CONTEXT_SESSION_COUNT=5   # 展示5个历史session

# 禁用Chroma向量搜索（只用SQLite）
export CLAUDE_MEM_CHROMA_ENABLED=false
```

### 隐私标签

```markdown
<private>敏感内容</private>  # 完全不存储
```

### 何时启用/禁用

```
✅ 启用Claude-Mem场景:
- 长期项目需要跨会话记忆
- 需要搜索历史工作
- 复杂项目的持续学习

❌ 禁用Claude-Mem场景:
- 一次性/临时任务
- 敏感项目（即使有private标签）
- token预算紧张时（timeline会增加上下文）
```

---

## 4. PUA

### 3种触发机制

| 机制 | 触发条件 | 效果 |
|------|----------|------|
| **用户语言触发** | "try harder"/"别偷懒"/"为什么还不行" | 立即激活PUA |
| **失败触发** | 连续2+次Bash失败 | 自动L1-L4升级 |
| **Always-On** | 启用always_on模式 | 每次SessionStart注入PUA协议 |

### L1-L4升级机制

```
失败Count=2 → L1: 换本质不同方案
失败Count=3 → L2: 搜索+源码+3假设
失败Count=4 → L3: 7项检查清单
失败Count>=5 → L4: 拼命模式
```

### 控制命令

```bash
# 启用Always-On（推荐用于困难问题）
/pua:on

# 禁用Always-On
/pua:off

# 手动激活
/pua              # 核心PUA skill
/pua:p7           # P7骨干模式
/pua:p9           # P9 Tech Lead

# 取消Loop模式
/pua:cancel-pua-loop
```

### 何时启用/禁用

```
✅ 启用PUA场景:
- 复杂调试问题（超过3次失败）
- AI容易放弃的任务
- 需要穷尽一切解决方案的场景
- 验收测试/生产问题

❌ 禁用PUA场景:
- 简单明确的任务（一次就能成功）
- 快速原型
- Agent正常工作时不需打扰
- 用户失去耐心想要快速完成
```

---

## 5. frontend-design

### 触发机制

**无hooks**，通过Skill内容影响Agent行为。

```
Skill内容 → Agent决定何时激活 → Design Before Code原则
```

### 何时激活

```
✅ 激活frontend-design场景:
- 任何前端UI开发
- 需要设计方向感
- 不想生成"AI slop"界面

❌ 跳过frontend-design场景:
- 后端/API开发
- 已有明确设计稿只需实现
- 内部工具（美观不重要）
```

### 整合到CLAUDE.md

```markdown
## Frontend Design
所有前端代码生成遵循 anthropic/frontend-design skill。
如需设计系统查询：`python3 resources/design/search.py "关键词" --domain style`
```

---

## 6. ui-ux-pro-max

### 触发机制

**无hooks**，通过Skill+CLI使用。

### 使用方式

```bash
# 搜索设计资源
python3 resources/design/search.py "fintech" --domain product
python3 resources/design/search.py "glassmorphism" --domain style

# 生成完整设计系统
python3 resources/design/design_system.py "瑜伽工作室"
```

### 何时使用

```
✅ 使用ui-ux-pro-max场景:
- 新项目启动，需要设计方向
- 不确定该用什么视觉风格
- 需要完整设计系统文档
- 特定行业应用（医疗/金融/电商）

❌ 跳过ui-ux-pro-max场景:
- 已有设计系统
- 快速修复，不需改设计
- 内部工具
```

---

## 深度整合：何时用什么

### 决策树

```
新任务开始
    │
    ├── 是否有前端UI？
    │   ├── 是 → frontend-design 自动影响
    │   │       └── 需要设计系统？ → design_system.py
    │   └── 否 → 继续
    │
    ├── 是否复杂/创意工作？
    │   ├── 是 → planning-before-coding skill
    │   │       └── 启用 superpowers hooks
    │   └── 否 → 继续
    │
    ├── 是否需要测试驱动？
    │   ├── 是 → tdd-workflow skill
    │   └── 否 → 继续
    │
    ├── 是否调试问题？
    │   ├── 是 → systematic-debugging skill
    │   │       └── 超过2次失败？ → /pua 激活
    │   └── 否 → 继续
    │
    └── 是否需要跨会话记忆？
        ├── 是 → Claude-Mem 启用
        └── 否 → 基础模式
```

### Hooks启用/禁用速查表

| 项目 | 默认状态 | 禁用命令 |
|------|----------|----------|
| ECC | ✅ 全部启用 | `ECC_HOOK_PROFILE=minimal` |
| Superpowers | ✅ SessionStart | 注释hooks.json |
| Claude-Mem | ✅ 全部启用 | `export CLAUDE_MEM_DISABLED=1` |
| PUA | ❌ 关闭 | `export PUA_ALWAYS_OFF=1` |
| frontend-design | Skill影响 | 通过CLAUDE.md控制 |
| ui-ux-pro-max | 手动调用 | - |

---

## 环境变量配置模板

```bash
# ~/.claude/env 或项目 .env

# ECC - 标准模式（需要严格时用strict）
export ECC_HOOK_PROFILE=standard

# Claude-Mem - 启用但控制量
export CLAUDE_MEM_CONTEXT_OBSERVATIONS=30
export CLAUDE_MEM_EXCLUDED_PROJECTS="**/tmp/**,**/node_modules/**"

# PUA - 默认关闭，有需要时手动/pua:on
export PUA_ALWAYS_OFF=1

# Superpowers - 按需
# (无环境变量，通过hooks.json控制)
```

---

## 最大化价值的使用场景

| 场景 | 启用项目 | 禁用项目 | 为什么 |
|------|----------|----------|--------|
| **复杂功能开发** | ECC(全) + Superpowers + Claude-Mem + PUA | - | 需要所有工具辅助 |
| **快速原型** | frontend-design | ECC(全) + Superpowers | 快速迭代，不需质量门禁 |
| **调试生产问题** | PUA + systematic-debugging | ECC hooks | 需要穷尽一切 |
| **学习/研究代码** | Claude-Mem | PUA | 需要记忆探索过程 |
| **一次性脚本** | - | 所有 | 不需要任何辅助 |
| **TDD开发** | ECC(TDD hooks) + tdd-workflow | PUA | 流程驱动，不需要压力 |
| **设计新系统** | ui-ux-pro-max + frontend-design | PUA | 创意工作不需要压力 |
