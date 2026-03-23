# 任务 task-048-task-template-single-source

## 任务摘要

- 短编号：`t-048`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  把 task 执行合同模板收口成唯一可渲染来源。
- 为什么现在：
  当前 task 合同骨架同时散落在模板文件、create-task、测试夹具和反馈脚本里；每次改模板都要改多处，最容易重新制造 contract drift。
- 承接边界：
  只处理可复用 task 模板的单点真相：`tasks/templates/task-template.md` 成为唯一 canonical scaffold，其余入口统一从它渲染；不批量迁移历史 task，也不同时做规则文档去重和兼容层清理。
- 完成定义：
  修改 task 合同模板后，不再需要同时改 `create-task`、测试夹具和反馈脚本；新建 task 与模板生成结果都来自同一份 canonical scaffold。

## 执行合同

### 要做

- 把 `tasks/templates/task-template.md` 改成带稳定占位符的 canonical scaffold。
- 新增轻量 task 模板渲染器，供 `create-task` 与反馈脚本复用。
- 让 Python 测试夹具从同一模板渲染示例 task，而不是内嵌整份 markdown。
- 补最小测试，锁住 `create-task` 与反馈脚本都从 canonical scaffold 读取。

### 不做

- 不批量迁移历史 task 文档。
- 不修改 `task-001` 历史种子样本。
- 不同时推进规则文档去重或 portal / release 兼容层清理。

### 约束

- 只做单文件模板 + 轻量渲染器，不新增重型模板系统。
- 继续保持 task 为执行合同，机器 provenance 不回流到 task 正文。
- 改动必须绑定 task、更新 memory，并通过静态 / 构建 / 运行态门禁。

### 关键风险

- 如果模板渲染器做重，会把瘦身任务重新做成新系统。
- 如果测试夹具没有真正切到同源模板，后续模板漂移会继续发生。

### 测试策略

- 为什么测：这轮的价值就在于“改一处就够”，所以必须锁住 create-task、反馈脚本和测试夹具是否同源。
- 测什么：canonical 模板渲染、`create-task` 输出、反馈脚本生成结果、历史 task 解析兼容性。
- 不测什么：不做页面视觉回归，也不做历史 task 的批量迁移测试。
- 当前最小集理由：先保护最容易漂移的模板主链，不把这轮瘦身扩成重型模板框架测试。

## 交付结果

- 状态：doing
- 体验验收结果：
  待验收
- 交付结果：
  未交付
- 复盘：
  未复盘
