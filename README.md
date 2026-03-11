# AI Operating System Bootstrap Kit V1

用于在任意新项目中快速冷启动一套轻内核、专业前台、对小白友好的 AI Operating System。

## 包含内容

- `apps/studio`：Next.js 指挥舱 UI
- `bootstrap`：轻量 brief、schema、模板和托管区块
- `scripts`：Python 生成器、审计器、proposal/apply 流程
- `docs`：规范知识库输出目录
- `tests`：CLI 与 UI 基础测试

## 常用命令

```bash
pnpm install
pnpm bootstrap:scaffold
pnpm bootstrap:audit
pnpm dev
pnpm test
```

## 设计原则

- Git 文件即真相
- 提案先行，确认后写入
- 小白只回答少量高层问题，系统自动补齐治理细节
- 默认看摘要，不默认看专家级结构
- 最佳实践保留在内核里自动执行
