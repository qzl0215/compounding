# docs

## 模块目标

负责只读文档门户的文档树构建、Markdown 读取、frontmatter 规范化、语义化 Markdown 渲染和文档展示组件。

## 入口与拥有面

- 路由：`/knowledge-base`
- 页面：`apps/studio/src/app/knowledge-base/page.tsx`
- Service：`apps/studio/src/modules/docs/repository.ts`
- 组件：`apps/studio/src/modules/docs/components/doc-viewer.tsx`
- 文档：`docs/*`、`memory/*`、`tasks/*`、`code_index/*`

## 常改文件

- `apps/studio/src/app/knowledge-base/page.tsx`
- `apps/studio/src/modules/docs/repository.ts`
- `apps/studio/src/modules/docs/reader.ts`
- `apps/studio/src/modules/docs/rendering.ts`
- `apps/studio/src/modules/docs/structure.ts`
- `apps/studio/src/modules/docs/components/doc-viewer.tsx`
- `apps/studio/src/modules/docs/__tests__/repository.test.ts`

## 不变量

- docs 模块只负责只读读取、规范化和渲染，不承担 mutation 或 git 判定。
- frontmatter、标题别名和 managed block 处理必须稳定，不能让知识库入口读到脏结构。
- 文档门户只展示真相源，不替代 task、release 或 plan 的主状态流。

## 推荐校验

- `pnpm --filter studio test -- apps/studio/src/modules/docs/__tests__/repository.test.ts`
- `pnpm --filter studio build`

## 常见改动

- 调整知识库树、阅读页或 Markdown 渲染行为。
- 调整 frontmatter 解析、标题别名或 section 摘要提取。
- 调整 AI rewrite / docs 相关的入口上下文。
