# 建立任务与治理差距绑定协议

## 任务摘要

- 任务 ID：`task-094`
- 短编号：`t-094`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  建立任务与治理差距绑定协议
- 为什么现在：
  当前治理 gap 已经独立成长期 backlog，但 task 仍无法合法绑定 gap，导致施工只能靠文字理解承接问题空间。
- 承接边界：
  只覆盖治理控制面的 Gap -> Task 绑定协议；补 task 合同字段、创建入口、解析与校验；把治理 gap backlog 与 task 双向引用接通；不扩到 truth 回写归口、guard 映射或 skill 协议。
- 完成定义：
  新建治理类 task 时必须显式绑定一个开放中的治理 gap，并声明来源断言与回写目标；任务读取层和校验层都能识别这些字段；治理 gap backlog 可反向看到 linked_tasks。
- 交付轨道：`direct_merge`

## 治理绑定

- 主治理差距：`GOV-GAP-01`
- 来源断言：`A4`
- 回写目标：
  - `Current`
  - `Tests`

## 执行合同

### 要做

- 为 task 合同新增 `linked_gap`、`from_assertion`、`writeback_targets`。
- 为 `create-task` 与解析/校验入口补治理 gap 绑定规则。
- 把 governance gap backlog 作为唯一 gap 主源接入。
- 补最小测试覆盖。

### 不做

- 不扩到业务 gap。
- 不改 task 状态机。
- 不实现 Assertion -> Guard 映射。
- 不实现 Consolidation -> Truth 归口规则。

### 约束

- 一个 task 只允许一个主 `linked_gap`。
- `linked_gap` 必须存在且不能是 `closed`。
- `writeback_targets` 只允许 `Current`、`Controlled Facts`、`Code Index`、`Tests`。
- 不新增默认第一跳主源。

### 关键风险

- 如果治理类 task 的识别边界过宽，会把存量 task 一次性判成不合法。
- 如果只改模板不改解析/校验，协议会退化成文本约定。
- 如果反向写 backlog 不稳定，会制造第二套状态源。

### 测试策略

- 为什么测：这是 task 合同与治理主源之间的结构改动，必须证明创建入口、解析结果、绑定校验和 backlog 引用都稳定。
- 测什么：apps/studio/src/modules/tasks/__tests__/contract.test.ts、tests 或 scripts/ai 相关校验测试、docs repository 读链测试、pnpm ai:validate-assets。
- 不测什么：不扩业务 task 批量迁移；不做 UI 展示改版；不做 full validation。
- 当前最小集理由：high

## 交付结果

- 状态：doing
- 体验验收结果：
  待验收
- 交付结果：
  正在把治理 gap backlog、task 合同、create-task、解析层和校验链接成单一绑定协议。
- 复盘：
  未复盘

## 分支

`codex/task-094-gap-task-binding`

## 关联模块



## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：no change: 未更新
