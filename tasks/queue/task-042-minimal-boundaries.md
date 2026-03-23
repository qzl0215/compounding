# 任务 task-042-minimal-boundaries

## 任务摘要

- 短编号：`t-042`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  收口 Plan / Task / Companion / Release 的最简边界
- 为什么现在：
  当前 task 已收成执行合同，但 companion 仍镜像过多人类合同语义，release 也仍保留第二份 task 摘要；若不继续收边界，AI 会重新在 plan、task、companion、release 之间来回猜真相。
- 承接边界：
  从单层 plan 中承接“plan 只负责想清楚、task 只负责做清楚、companion 只负责机器执行上下文、release 只负责验收与运行事实”这一段，把四类对象的边界真正切开。
- 完成定义：
  `/tasks` 与 `/releases` 都优先从 task 合同读取人类语义；companion 不再持久化第二份 task 正文；release 只保留最小 `delivery_snapshot` 作为历史兼容回退；主线文档对四类对象口径一致。

## 执行合同

### 要做

- 把 companion 原始 shape 收口成机器执行上下文，只保留 `task_id / task_path / contract_hash / current_mode / branch / planned_files / planned_modules / locks / lifecycle / artifacts`。
- 把 release registry 收口到环境与验收事实，并将三段 `delivery_*` 文案合并成最小 `delivery_snapshot`。
- 让 `/releases` 默认优先实时解析 task 合同字段显示摘要、风险和完成定义，只在历史兼容时回退到 `delivery_snapshot`。
- 补齐 `t-042`、`current-state`、`roadmap`、`operating-blueprint` 与工作流文档的边界口径，并更新回归测试。

### 不做

- 不新增 plan 页面、数据库或第二套工单系统。
- 不重做首页阶段模型，也不扩 orchestration UI。
- 不一次性重写全部历史 task 文档；历史数据通过兼容读模型平滑迁移。

### 约束

- 只允许一层 plan，唯一主源仍是 `memory/project/operating-blueprint.md`。
- task 继续是执行合同；机器 provenance 不得回流到 task 正文。
- release 只保留最小回退快照；主语义默认优先读 task 合同。
- 历史 release、历史 task 和既有 companion 必须继续可读，不允许用一次性迁移阻塞主线。

### 关键风险

- 若 release 与 task 绑定改造不彻底，页面会继续在 task 合同和 release 快照之间双写。
- 若 companion 原始 shape 兼容处理失误，`pre-task / review / release handoff` 链路会回归失败。

### 测试策略

- 为什么测：这是四类真相边界的结构性改动，必须同时保护 companion 生命周期、release 回退策略和页面投影的一致性。
- 测什么：companion 原始 shape、contract hash / scope resync、release `delivery_snapshot` 回退、task 优先解析、任务页 machine facts、校验链继续通过。
- 不测什么：不为纯文案或纯说明字段单独补快照测试，也不新增重复的 UI 装饰测试。
- 当前最小集理由：只锁最容易断裂的“机器上下文 / release 回退 / 页面优先解析”三条链，避免再靠人工排查重复真相。

## 交付结果

- 状态：doing
- 体验验收结果：
  待验收
- 交付结果：
  未交付
- 复盘：
  未复盘
