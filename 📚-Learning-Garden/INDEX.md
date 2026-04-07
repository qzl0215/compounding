# 📚 Learning Garden - Claude Code Skills/Plugins 研究清单

> 整理自 2026-04-07 | 存储于 `📚-Learning-Garden/`

---

## 项目总览

| # | 项目名 | 类型 | 用途定位 | 本地整合方案 |
|---|--------|------|----------|--------------|
| 01 | [everything claude code](#01-everything-claude-code) | Plugin/Skill集合 | 全能型开发环境 | ⭐⭐⭐⭐⭐ 必装 |
| 02 | [superpowers](#02-superpowers) | Plugin/Skill集合 | 软件工程工作流 | ⭐⭐⭐⭐ 强烈推荐 |
| 03 | [frontend design](#03-frontend-design) | Skill | 官方前端设计指导 | ⭐⭐⭐⭐ 强烈推荐 |
| 04 | [office suite](#04-office-suite) | 工具 | 极简办公套件 | ⭐ 趣味/参考 |
| 05 | [ui ux pro max](#05-ui-ux-pro-max) | Skill + CLI | UI/UX设计智能 | ⭐⭐⭐⭐⭐ 必装 |
| 06 | [claude mem](#06-claude-mem) | Plugin | 跨会话持久记忆 | ⭐⭐⭐⭐ 强烈推荐 |
| 07 | [awesome claaude code](#07-awesome-claude-code) | 资源列表 | 资源导航 | ⭐⭐⭐ 参考学习 |
| 08 | [lightRAG](#08-lightrag) | Python库 | 知识图谱RAG | ⭐⭐⭐⭐ 特定场景 |
| 09 | [skill-creator](#09-skill-creator) | Skill | 自动创建Skill | ⭐⭐⭐ 进阶用 |
| 10 | [PUA (efficiency Fix)](#10-pua) | Skill | 防放弃/效率提升 | ⭐⭐⭐⭐ 强烈推荐 |

---

## 01. everything claude code

**GitHub:** https://github.com/affaan-m/everything-claude-code
**文件夹:** `01-everything-claude-code/`
**Star:** 大量 | **类型:** Plugin + Skill集合

### 项目概述
Anthropic黑客马拉松获胜者构建的完整Claude Code配置集合，包含生产级agents、skills、hooks、commands、rules和MCP配置，经过10多个月真实产品开发验证。

### 核心内容
- `agents/` -  delegation子代理(planner, code-reviewer, tdd-guide等)
- `skills/` - 工作流定义和领域知识
- `commands/` - 斜杠命令(/tdd, /plan, /e2e等)
- `hooks/` - 触发式自动化(session persistence等)
- `rules/` - 始终遵循的准则(安全、编码风格、测试要求)
- `mcp-configs/` - MCP服务器配置
- `contexts/` - 上下文管理
- `scripts/` - 跨平台Node.js工具

### 本地整合方案
```bash
# 1. 添加市场并安装插件
/plugin marketplace add affaan-m/everything-claude-code
/plugin install ecc@ecc

# 2. 手动安装规则（插件无法自动分发rules）
mkdir -p ~/.claude/rules
cp -r 01-everything-claude-code/rules/common ~/.claude/rules/
cp -r 01-everything-claude-code/rules/typescript ~/.claude/rules/  # 根据技术栈选择
cp -r 01-everything-claude-code/rules/python ~/.claude/rules/
cp -r 01-everything-claude-code/rules/golang ~/.claude/rules/

# 3. 复制hooks到用户目录
cp -r 01-everything-claude-code/hooks/* ~/.claude/hooks/

# 4. 复制commands
cp -r 01-everything-claude-code/commands/* ~/.claude/commands/

# 5. 使用技能
/ecc:plan "添加用户认证"
```

### 适用场景
- 需要完整开发工作流的复杂项目
- 需要TDD、代码审查、自动化测试的项目
- 需要会话持久化和跨会话记忆的项目
- Token优化和成本控制

### 在Compounding项目中的应用
- [ ] 复制rules到 `~/.claude/rules/`
- [ ] 集成hooks到项目
- [ ] 使用 `/ecc:plan` 命令进行复杂功能规划

---

## 02. superpowers

**GitHub:** https://github.com/obra/superpowers
**文件夹:** `02-superpowers/`
**Star:** 大量 | **类型:** Plugin + Skill集合

### 项目概述
完整的软件开发工作流插件，构建在一组可组合的"skills"和初始指令之上。核心思想：AI不会立即跳入编码，而是先问清楚需求、制定规格、确认计划后才开始。

### 核心理念
1. **先规划再编码** - 不直接写代码，先理解用户真正想做什么
2. **规格确认** - 分块展示规格说明，确保可读可消化
3. **TDD强调** - 真正的红/绿测试，YAGNI，DRY
4. **子代理驱动开发** - agents工作分解任务、审查、持续推进

### 本地整合方案
```bash
# Claude Code官方市场
/plugin install superpowers@claude-plugins-official

# 或通过市场
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace

# Cursor
/add-plugin superpowers

# Codex
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md

# OpenCode
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
```

### 适用场景
- 复杂的多阶段软件工程项目
- 需要TDD驱动的开发团队
- 需要AI自主工作数小时不偏离计划的项目
- 重视代码质量和架构设计的项目

### 在Compounding项目中的应用
- [ ] 在大型功能开发前使用superpowers流程
- [ ] 启用TDD工作流
- [ ] 使用子代理进行代码审查

---

## 03. frontend design

**GitHub:** https://github.com/anthropics/claude-code (官方内置)
**文件夹:** `03-frontend-design/`
**Star:** N/A | **类型:** 官方Skill

### 项目概述
Anthropic官方的前端设计Skill，告诉Claude在写代码前先选择实际的美学方向，而不是默认使用Inter字体+紫色渐变+圆角卡片。

### 核心改变
- Claude在编码前先选择方向(brutalist, editorial, retro-futuristic等)
- 要求真正的字体配对，不是随便一个sans-serif
- 阻止通用组件模式和cookie-cutter布局
- 强制使用CSS变量和统一的颜色系统

### 本地整合方案
```bash
# 安装
claude plugin add anthropic/frontend-design

# 自动激活，无需手动调用
```

### 适用场景
- 任何前端开发项目
- 需要独特视觉风格的项目
- 避免AI生成"塑料感"界面的项目

### 在Compounding项目中的应用
- [ ] 所有前端项目默认启用
- [ ] 在CLAUDE.md中引用此skill的设计原则

---

## 04. office suite (awfice)

**GitHub:** https://github.com/zserge/awfice
**文件夹:** `04-office-suite/`
**Star:** 少量 | **类型:** 极简工具集

### 项目概述
"世界最小的办公套件" - 每一个app都小于1KB，纯JavaScript实现，实际上只是一行代码。打包成data URL，可以直接使用但无法保存状态。

### 包含工具
| 工具 | 大小 | 用途 |
|------|------|------|
| edit.html | 59字节 | 富文本编辑器 |
| calc.html | 679字节 | 表格(带公式) |
| draw.html | 327字节 | 画图应用 |
| beam.html | 622字节 | 演示文稿 |
| code.html | 686字节 | 代码编辑器 |
| calculator.html | 657字节 | 计算器 |

### 本地整合方案
```bash
# 直接在浏览器打开或收藏
# 文本编辑器
open 04-office-suite/edit.html

# 表格
open 04-office-suite/calc.html

# 画图
open 04-office-suite/draw.html

# 演示
open 04-office-suite/beam.html

# 或收藏data URL版本（见各文件README）
```

### 适用场景
- 快速临时笔记
- 不希望数据被保存的隐私场景
- 代码行数挑战/极简主义学习

### 在Compounding项目中的应用
- [ ] 作为快速草稿工具在需要时使用
- [ ] 学习极简代码技巧

---

## 05. ui ux pro max

**GitHub:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
**文件夹:** `05-ui-ux-pro-max/`
**Star:** 16.9k | **类型:** Skill + CLI

### 项目概述
AI驱动的专业UI/UX设计智能工具包，提供240+样式、127字体配对、99 UX指南、161产品类型、67种UI风格。支持设计系统自动生成。

### 核心功能(v2.0)
- **智能设计系统生成** - 输入需求，自动生成完整设计系统
- **推理引擎** - 自动匹配风格
- **多平台支持** - React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind等

### 本地整合方案
```bash
# 安装CLI
npm install -g uipro-cli

# 初始化项目
cd your-project
uipro init

# 搜索设计资源
python3 05-ui-ux-pro-max/src/ui-ux-pro-max/scripts/search.py "fintech dashboard" --domain product
python3 05-ui-ux-pro-max/src/ui-ux-pro-max/scripts/search.py "glassmorphism" --domain style

# Claude Code安装
claude plugin add nextlevelbuilder/ui-ux-pro-max-skill

# 生成设计系统
python3 05-ui-ux-pro-max/src/ui-ux-pro-max/scripts/design_system.py "Serenity Spa"
```

### 适用场景
- 需要专业UI/UX设计的Web/移动应用
- 不确定该用什么视觉风格的项目
- 需要设计系统文档的项目
- 快速原型开发

### 在Compounding项目中的应用
- [ ] 前端项目优先使用此skill进行设计
- [ ] 使用 `uipro init` 初始化新项目
- [ ] 在CLAUDE.md中集成设计系统生成流程

---

## 06. claude mem

**GitHub:** https://github.com/thedotmack/claude-mem
**文件夹:** `06-claude-mem/`
**Star:** 大量 | **类型:** Plugin (MCP + Hooks)

### 项目概述
为Claude Code构建的持久化记忆压缩系统。通过5个生命周期Hook追踪工具使用情况、压缩观察结果，在未来会话中注入相关上下文。

### 架构
- **5个Lifecycle Hooks**: SessionStart → UserPromptSubmit → PostToolUse → Summary → SessionEnd
- **Worker Service**: Express API (port 37777)
- **Database**: SQLite3 at `~/.claude-mem/claude-mem.db`
- **Chroma**: 向量嵌入用于语义搜索
- **Viewer UI**: React界面 at http://localhost:37777

### 本地整合方案
```bash
# 克隆并安装
cd 06-claude-mem
npm install
npm run build

# 在Claude Code中安装
/plugin install claude-mem@marketplace

# 或手动
mkdir -p ~/.claude/plugins/marketplaces/thedotmack
cp -r plugin/* ~/.claude/plugins/marketplaces/thedotmack/

# 启动worker
cd 06-claude-mem
npm run worker

# 访问UI
open http://localhost:37777
```

### 隐私控制
```markdown
<private>敏感内容</private>  # 用户级隐私控制，自动阻止存储
```

### 适用场景
- 长期项目需要跨会话记忆
- 需要搜索历史工作的项目
- 需要AI记住项目特定模式和约定的项目

### 在Compounding项目中的应用
- [ ] 安装并启用claude-mem
- [ ] 配置隐私标签保护敏感信息
- [ ] 使用mem-search skill搜索历史工作

---

## 07. awesome claude code

**GitHub:** https://github.com/hesreallyhim/awesome-claude-code
**文件夹:** `07-awesome-claude-code/`
**Star:** 大量 | **类型:** 资源列表

### 项目概述
精选的skills、agents、plugins、hooks和其他增强Claude Code工作流的工具列表。按类别组织，是发现新工具的导航点。

### 内容分类
- Agent Skills
- Workflows & Knowledge Guides
- Tooling
- Hooks
- Slash-Commands
- CLAUDE.md Files
- Alternative Clients
- Official Documentation

### 本地整合方案
```bash
# 这是一个资源列表，不是可安装插件
# 阅读 README.md 发现有用的工具

# 使用提供的资源表格
open 07-awesome-claude-code/THE_RESOURCES_TABLE.csv
```

### 适用场景
- 发现新的Claude Code工具和技能
- 学习最佳实践和工作流
- 探索社区贡献的资源

### 在Compounding项目中的应用
- [ ] 定期查阅发现新工具
- [ ] 参考其中推荐的CLAUDE.md文件格式

---

## 08. lightRAG

**GitHub:** https://github.com/HKUDS/LightRAG
**文件夹:** `08-lightRAG/`
**Star:** 大量 | **类型:** Python RAG库

### 项目概述
简单快速的检索增强生成框架，使用基于图的知识表示。系统从文档中提取实体和关系、构建知识图谱，使用多模态检索(局部、全局、混合、混合、朴素)进行查询。

### 核心架构
- **lightrag.py**: 主要编排类
- **kg/**: 存储实现(JSON, NetworkX, Neo4j, PostgreSQL, MongoDB, Redis, Milvus, Qdrant, Faiss, Memgraph)
- **llm/**: LLM提供者绑定
- **api/**: FastAPI服务器 + React WebUI

### 本地整合方案
```bash
# 安装
cd 08-lightRAG
uv sync

# 或pip安装
pip install lightrag-hku

# 运行API服务器
cp env.example .env  # 编辑配置
lightrag-server

# 或开发模式
uvicorn lightrag.api.lightrag_server:app --reload

# WebUI
cd lightrag_webui && bun install && bun run dev
```

### Python集成示例
```python
from lightrag import LightRAG
from lightrag.llm.openai import gpt_4o_mini_complete, openai_embed

rag = LightRAG(
    working_dir="./rag_storage",
    llm_model_func=gpt_4o_mini_complete,
    embedding_func=openai_embed
)

await rag.initialize_storages()
await rag.ainsert("Your text here")
result = await rag.aquery("Your question", param=QueryParam(mode="hybrid"))
```

### 适用场景
- 需要知识库问答的系统
- 文档检索和问答
- 复杂关系数据的查询
- 需要图谱可视化的项目

### 在Compounding项目中的应用
- [ ] 考虑用于项目文档RAG系统
- [ ] 集成到需要知识检索的功能中

---

## 09. skill-creator

**GitHub:** https://github.com/okjpg/skill-creator
**文件夹:** `09-skill-creator/`
**Star:** 少量 | **类型:** Skill (创建工具)

### 项目概述
一个用于Claude Code和AI代理的skill，自动创建其他skills。你描述一个流程，agent将其转化为结构化skill，经过QA自动检验，部署到 `~/.claude/skills/`。

### 核心功能
- **Wizard可视化** - 4步引导生成SKILL.md + evals.json
- **3种创建模式**:
  1. 捕获刚完成的工作
  2. 粘贴现有workflow描述
  3. 描述一个想法

### 本地整合方案
```bash
# 一键安装
curl -fsSL https://raw.githubusercontent.com/okjpg/skill-creator/main/install.sh | bash

# 使用
/criar-skill

# 可视化wizard
open ~/.claude/skills/criar-skill/wizard.html
```

### QA自动检查
1. 文件命名规范
2. 前言格式
3. 描述清晰度
4. 触发条件
5. 示例完整性
6. 上下文边界
7. 依赖声明
8. 错误处理
9. 可维护性
10. 可测试性

### 适用场景
- 重复性工作需要自动化的场景
- 想把流程固化为可复用skill
- 需要在团队分享工作流

### 在Compounding项目中的应用
- [ ] 将常用的Compounding工作流固化为skill
- [ ] 使用wizard创建项目特定skill

---

## 10. PUA (efficiency Fix)

**GitHub:** https://github.com/tanweai/pua
**文件夹:** `10-pua/`
**Star:** 大量 | **类型:** Skill

### 项目概述
使用科技公司的PUA话术(中文版)/PIP(英文版)来强制AI在放弃前穷尽所有可能的解决方案。支持多种AI编码agent，核心是防止AI产生5种懒惰模式。

### 5种AI懒惰模式
| 模式 | 行为 |
|------|------|
| Brute-force retry | 同样命令跑3次然后说无法解决 |
| Blame the user | 推卸给用户/环境 |
| Idle tools | 有工具但不用 |
| Busywork | 原地打转 |
| Passive waiting | 修复表面问题就停止 |

### 3种核心能力
1. **PUA话术** - 让AI害怕放弃
2. **调试方法论** - 给AI不放弃的能力
3. **主动性强制** - 让AI主动而非被动等待

### 本地整合方案
```bash
# 安装skill
cd 10-pua

# Claude Code
cp -r .claude-plugin ~/.claude/plugins/marketplaces/tanweai/

# 或使用plugin命令
/plugin install pua@marketplace

# 手动安装
mkdir -p ~/.claude/skills
cp -r skills/* ~/.claude/skills/

# 触发方式
/pua                    # 手动触发
# 自动触发: 连续失败2+次、即将说"无法"、推卸责任、被动等待时
```

### 适用场景
- AI容易放弃的项目
- 复杂调试问题
- 需要AI主动探索解决方案
- 防止AI在困难任务前退缩

### 在Compounding项目中的应用
- [ ] 安装PUA skill防止AI放弃
- [ ] 在调试循环中使用 /pua 命令
- [ ] 启用自动触发监控

---

## 第一梯队整合状态

### ✅ 已完成整合

| 项目 | Claude Code插件 | Compounding资源库 | 跨Agent复用 |
|------|----------------|-------------------|------------|
| everything claude code | ✅ 已安装 | ✅ `resources/skills/` | ✅ SKILL.md格式 |
| frontend design | ✅ 已安装 | ✅ `resources/skills/` | ✅ Prompt片段 |
| ui ux pro max | ✅ 已安装 | ✅ `resources/design/` | ✅ Python API |

### 已提取的Skills

位于 `Compounding/resources/skills/`:

| Skill | 来源 | 核心价值 |
|-------|------|----------|
| `tdd-workflow.md` | ECC | RED-GREEN-REFACTOR + 80%覆盖率 |
| `security-checklist.md` | ECC | OWASP Top 10 + 部署检查表 |
| `coding-standards.md` | ECC | Immutability原则 + 编码规范 |
| `frontend-design-principles.md` | Anthropic | Design Before Code + NEVER清单 |
| `design-system-generator.md` | ui-ux-pro-max | 完整设计系统生成 |
| `continuous-learning.md` | ECC | 会话模式提取 |

### 设计资源库

位于 `Compounding/resources/design/`:

| 资源 | 规模 | 用途 |
|------|------|------|
| `data/products.csv` | 161产品类型 | 产品类型匹配 |
| `data/styles.csv` | 67种UI风格 | 风格搜索 |
| `data/colors.csv` | 161配色方案 | 配色系统 |
| `data/typography.csv` | 57字体配对 | 字体选择 |
| `data/ui-reasoning.csv` | 161行业规则 | 推理引擎 |
| `core.py` | BM25搜索引擎 | 本地搜索 |
| `design_system.py` | 设计系统生成器 | 自动生成设计系统 |

---

## 整合优先级建议

### 必装 (第一梯队)
1. **everything claude code** - 全面提升开发环境
2. **ui ux pro max** - UI/UX设计质量保障
3. **frontend design** - 官方设计指导

### 强烈推荐 (第二梯队)
4. **superpowers** - 工程流程规范
5. **claude mem** - 持久记忆
6. **PUA** - 防放弃机制

### 进阶/特定场景 (第三梯队)
7. **lightRAG** - 知识检索(如有需求)
8. **skill-creator** - 创建自定义skill
9. **awesome claaude code** - 资源发现
10. **office suite** - 快速临时工具

---

## 下一步行动

- [ ] 确定安装优先级
- [ ] 逐个安装第一梯队项目
- [ ] 配置每个项目的用户级设置
- [ ] 在Compounding项目中集成关键skill
- [ ] 测试各skill的触发和工作情况

---

*最后更新: 2026-04-07*
