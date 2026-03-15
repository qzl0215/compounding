# compounding_bootstrap

## 模块目标

为当前仓库或新项目生成、审计、提案式改写 AI-Native Repo 骨架。

## 输入

- `bootstrap/project_brief.yaml`
- 目标仓库路径
- proposal prompt（可选）

## 输出

- canonical docs / memory / tasks / code_index skeleton
- audit result
- proposal metadata / diff / candidate files

## 关键职责

- 配置解析
- 文档渲染
- scaffold
- audit
- proposal / apply

## 依赖

- Python 标准库
- 仓库内 bootstrap 资源

## 对外暴露接口

- `scaffold`
- `audit`
- `validate-config`
- `propose`
- `apply-proposal`

## 不该做什么

- 不直接依赖 Studio
- 不成为第二套任务系统
- 不静默保留失效文档结构
