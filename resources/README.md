# Compounding Resources Library

> 跨Agent可复用的Skills、Design系统和Prompt片段
> 整理自 2026-04-07

---

## 目录结构

```
resources/
├── skills/                    # 可复用的Skill定义
│   ├── tdd-workflow.md           # TDD工作流
│   ├── security-checklist.md     # 安全检查清单
│   ├── coding-standards.md       # 编码规范
│   ├── frontend-design-principles.md  # 前端设计原则
│   ├── design-system-generator.md # 设计系统生成器
│   ├── continuous-learning.md     # 持续学习模式
│   ├── planning-before-coding.md  # 先规划再编码
│   ├── systematic-debugging.md   # 系统化调试
│   ├── anti-give-up.md          # 反放弃机制
│   └── session-memory.md        # 会话记忆模式
├── design/                    # 设计资源
│   ├── data/                     # CSV数据库
│   │   ├── products.csv          # 161产品类型
│   │   ├── styles.csv           # 67 UI风格
│   │   ├── colors.csv           # 161配色方案
│   │   ├── typography.csv      # 57字体配对
│   │   ├── landing.csv          # 24落地页模式
│   │   ├── charts.csv          # 25图表类型
│   │   ├── ux-guidelines.csv    # 99 UX指南
│   │   ├── ui-reasoning.csv     # 161行业推理规则
│   │   └── stacks/              # 框架特定指南
│   ├── core.py                  # BM25搜索引擎
│   ├── design_system.py         # 设计系统生成器
│   └── search.py                # CLI搜索入口
└── prompts/                    # Prompt片段
    └── frontend-design-fragment.md  # 前端设计Prompt注入
```

---

## Skills 快速索引

### 第一梯队 (已安装Claude Code插件)

| Skill | 来源 | 适用场景 |
|-------|------|----------|
| [tdd-workflow](skills/tdd-workflow.md) | ECC | 任何需要测试的开发 |
| [security-checklist](skills/security-checklist.md) | ECC | 涉及Auth、数据、API的功能 |
| [coding-standards](skills/coding-standards.md) | ECC | 任何代码审查和编写 |
| [frontend-design-principles](skills/frontend-design-principles.md) | Anthropic | 任何前端UI生成 |
| [design-system-generator](skills/design-system-generator.md) | ui-ux-pro-max | 新项目启动、需要设计系统 |
| [continuous-learning](skills/continuous-learning.md) | ECC | 长期项目、需要记忆 |

### 第二梯队 (已安装Claude Code插件)

| Skill | 来源 | 适用场景 |
|-------|------|----------|
| [planning-before-coding](skills/planning-before-coding.md) | Superpowers | 复杂功能、创意工作 |
| [systematic-debugging](skills/systematic-debugging.md) | Superpowers | 调试、问题排查 |
| [anti-give-up](skills/anti-give-up.md) | PUA | 防AI放弃、复杂问题 |
| [session-memory](skills/session-memory.md) | Claude-Mem | 会话总结、模式提取 |

---

## 在不同Agent中使用

### Claude Code

```bash
# 查看可用skills
ls ~/.claude/skills/

# 这些skills已通过ecc插件安装
```

### Cursor / WindSurf

```bash
# 在项目CLAUDE.md中引用
cat >> project/CLAUDE.md << 'EOF'

## 设计系统

使用 resources/design/ 中的设计数据库：

```bash
python3 resources/design/search.py "风格" --domain style
```

EOF
```

### Codex / OpenCode

```bash
# 在系统提示中注入
Fetch and follow instructions from /path/to/resources/prompts/frontend-design-fragment.md
```

### Generic Agent

```python
# 在agent初始化时加载skills
skills = [
    load_skill("resources/skills/tdd-workflow.md"),
    load_skill("resources/skills/security-checklist.md"),
    load_skill("resources/skills/coding-standards.md"),
]
```

---

## 设计系统生成示例

```python
import sys
sys.path.insert(0, 'resources/design')

from design_system import generate_design_system

# 生成完整设计系统
result = generate_design_system(
    query="fintech dashboard",
    project_name="MyFinance"
)

print(format_markdown(result))
```

**输出示例：**

```
TARGET: MyFinance - RECOMMENDED DESIGN SYSTEM

PATTERN: Dashboard + Data Visualization
  Conversion: Data-driven, clear hierarchy
  Sections: Hero metrics → Charts → Tables → Actions

STYLE: Dark OLED Finance
  Keywords: True black, data clarity, professional, premium
  Best For: Fintech, trading, analytics

COLORS:
  Primary:   #3B82F6 (Blue)
  Secondary: #10B981 (Green)
  Accent:    #F59E0B (Amber)
  Background: #000000 (True Black)
  Text:      #F8FAFC (Off-white)

TYPOGRAPHY: JetBrains Mono / Inter

ANTI-PATTERNS:
  ❌ Light mode
  ❌ Pastel colors
  ❌ Decorative illustrations
```

---

## 整合状态

| 组件 | 状态 | 备注 |
|------|------|------|
| skills/ | ✅ 完成 | 6个核心skill |
| design/data/ | ✅ 完成 | 161个产品类型 + 67风格 + 161配色 |
| design/core.py | ✅ 完成 | BM25搜索引擎 |
| design/design_system.py | ✅ 完成 | 设计系统生成器 |
| prompts/ | ✅ 完成 | Prompt注入片段 |

---

## Skill订阅系统

### 三层调用机制

| 层级 | 触发方式 | 说明 |
|------|----------|------|
| **inline** | 每次SessionStart注入 | 基础规范（coding-standards） |
| **mandatory** | force_when命中时 | 安全相关（security-checklist） |
| **advisory** | trigger_patterns命中时 | 按需建议 |
| **manual** | 显式请求 | paused状态时降级为manual |

### 三级订阅状态

| 状态 | 含义 | Token浪费 | 调用方式 |
|------|------|-----------|----------|
| **subscribed** | 正常激活 | 按层级触发 | inline/mandatory/advisory |
| **paused** | 暂停使用 | **零额外浪费** | 变成manual，显式请求才用 |
| **unsubscribed** | 退订 | **零浪费** | 完全不可用，从上下文移除 |

### 管理文件

| 文件 | 说明 |
|------|------|
| `memory/skills/subscriptions.json` | 订阅状态主文件 |
| `resources/skills/skill-index.json` | Skill索引（自动生成） |
| `resources/skills/lookup.py` | Skill查找脚本 |

### CLI用法

```bash
# 查找匹配的Skills
python3 resources/skills/lookup.py --context="实现新功能"

# 详细输出
python3 resources/skills/lookup.py --context="实现新功能" --verbose

# 包含paused状态的Skills
python3 resources/skills/lookup.py --context="实现新功能" --subscribed-only

# 指定阶段
python3 resources/skills/lookup.py --context="debug" --phase=executing
```

### Studio UI

在Studio中通过 Skills模块 统一管理：
- 表格视图：Skill名、摘要、层级、订阅状态
- 点击切换订阅状态（subscribed ↔ paused ↔ unsubscribed）
- 按状态筛选

### 10个Skills订阅建议

| Skill | 默认状态 | 理由 |
|-------|----------|------|
| coding-standards | **subscribed** | 基础规范，Token轻 |
| security-checklist | **subscribed** | 安全关键，force触发 |
| tdd-workflow | paused | 需要时手动启用 |
| planning-before-coding | paused | 复杂项目时启用 |
| systematic-debugging | paused | 调试时启用 |
| anti-give-up | paused | 困难问题时启用 |
| frontend-design-principles | paused | 前端项目时启用 |
| design-system-generator | paused | 新项目时启用 |
| session-memory | paused | 长期项目时启用 |
| continuous-learning | paused | 持续改进时启用 |

---

## 来源

- [everything-claude-code](https://github.com/affaan-m/everything-claude-code) - AGPL-3.0
- [anthropic/frontend-design](https://github.com/anthropics/claude-code) - Anthropic Official
- [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) - MIT

---

*最后更新: 2026-04-07*
