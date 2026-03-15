---
title: AI_OPERATING_MODEL
doc_role: reference
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-15
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - docs/DEV_WORKFLOW.md
  - memory/experience/README.md
  - code_index/module-index.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# AI 工作模型

## 标准阅读顺序

1. `AGENTS.md`
2. `docs/PROJECT_RULES.md`
3. `docs/ARCHITECTURE.md`
4. 当前任务文件
5. 相关 `module.md`
6. `code_index/*`
7. 必要代码
8. 动手前 `python3 scripts/pre_mutation_check.py`

## 任务驱动开发

- AI 默认围绕 `tasks/queue/*` 工作
- 若任务不存在，先用 `scripts/ai/create-task.ts` 生成
- 任务是 scope 和验收边界，不是可有可无的备注

## 上下文系统

- `code_index/module-index.md` 给模块入口
- `code_index/dependency-map.md` 给依赖方向
- `code_index/function-index.json` 给粗粒度函数索引
- `scripts/ai/build-context.ts` 负责把规则、架构、任务、模块和记忆压缩成最小上下文包

## 记忆系统

- 新经验先进入 `memory/experience/*`
- 已裁决事项进入 `memory/decisions/ADR-*.md`
- 当前项目状态和 roadmap 在 `memory/project/*`
- 经验重复验证后才允许升格到 `docs/*` 或 `AGENTS.md`

## 自进化闭环

扫描问题
→ 生成 task
→ 修改模块
→ 更新 memory
→ 更新 code_index
→ 进入 `main`
→ 生成 release
→ 切换或回滚
→ 在下一轮扫描中验证是否真正收敛

## 生产直发

- 生产发布以 `main` 为唯一主线
- 版本构建在后台 release 目录完成
- 线上切换只在构建和 smoke 成功后发生
- 若新版异常，优先选择：
  - 继续在 `main` 上修出下一次 release
  - 或直接回滚到上一个健康 release

## 工作原则

- 优先减少理解成本
- 优先减少重复逻辑
- 优先减少隐式依赖
- 不做大面积业务重写
- 创业团队文化优先：持续抓重点，不过度优化，少条条框框，但井井有条

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
