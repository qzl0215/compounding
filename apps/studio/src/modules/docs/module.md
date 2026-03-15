# docs

## 模块目标

负责只读文档门户的文档树构建、Markdown 读取、frontmatter 规范化和文档展示组件。

## 输入

- `AGENTS.md`
- `README.md`
- `docs/*`
- `memory/*`
- `code_index/*`
- `tasks/*`

## 输出

- 文档树
- 文档内容与元信息
- 文档阅读组件

## 关键职责

- 构建 live docs tree
- 读取 Markdown
- 清理 managed block 标记
- 规范化 frontmatter

## 依赖

- `gray-matter`
- `react-markdown`
- `remark-gfm`

## 对外暴露接口

- `getDocTree`
- `listMarkdownDocs`
- `readDoc`
- `DocTree`
- `DocViewer`

## 不该做什么

- 不负责 mutation
- 不负责任务创建
- 不负责 git 状态判定
