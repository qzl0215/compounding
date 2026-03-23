# 任务 task-041-task-execution-contract

## 任务摘要

- 短编号：`t-041`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  把 task 从“全量档案”收口成共享执行合同，只保留执行时真正需要的边界、结果和风险信息，把分支、提交、release、trace 等机器台账下沉到 companion、release 和投影层。
- 为什么现在：
  当前 task 仍然混合了目标、收益、风险、分支、提交、更新痕迹和发布版本，页面与校验器都被旧档案结构牵着走，正在限制 AI 自主执行和任务边界清晰度。
- 承接边界：
  从单层 plan 中承接“task 只负责做清楚，release / companion 负责机器台账”这一段，把模板、解析器、任务页和校验器一起切到合同视角。
- 完成定义：
  新建 task 默认生成合同结构；历史 task 不重写也能正常显示；`/tasks` 主表改成合同视角；task 文档不再要求手工维护机器 provenance；校验器只要求合同核心字段。

## 执行合同

### 要做

- 新建 task 合同结构与兼容解析层，支持旧字段映射到新合同视图。
- 把 `/tasks` 主表改成合同列：任务、为什么现在、完成定义、状态、关键风险、交付结果、操作。
- 把分支、提交、release、planned files 等机器事实下沉到 companion / release / delivery projection。
- 更新 `create-task`、task 校验器、heading aliases、bootstrap audit 与相关测试。

### 不做

- 不新增 plan 页面、数据库或第二套工单系统。
- 不一次性重写全部历史 task 文档。
- 不重做 release registry、companion 生命周期底层模型或首页需求总览。

### 约束

- `task` 仍是执行边界；未成熟事项继续留在 `memory/project/operating-blueprint.md`。
- 新结构必须兼容历史 task；只有被修改的 task 才按新结构回写。
- `当前模式` 若仍是阶段投影必须依赖的机器事实，应留在 companion / 投影层，不再回流到 task 主体。

### 关键风险

- 若只改模板不改解析与校验链，系统会同时存在两套 task 语义。
- 若机器 provenance 迁移不彻底，任务页仍会继续依赖 task 文档中的旧字段。

### 测试策略

- 为什么测：
  这是结构性改动，必须同时保护新模板、历史兼容、任务页渲染和校验器行为。
- 测什么：
  新模板创建、旧字段到合同视图映射、`/tasks` 合同列渲染、release/companion 机器事实继续可读。
- 不测什么：
  不为纯文案字段写额外快照海。
- 当前最小集理由：
  先锁住解析、渲染和校验三条主链，避免再靠人工肉眼发现合同字段断裂。

## 交付结果

- 状态：done
- 体验验收结果：
  已验收通过：task 文档已切到执行合同结构，`/tasks` 主表先展示为什么现在、完成定义、关键风险和交付结果，机器 provenance 已下沉到 companion / release / projection。
- 交付结果：
  已完成：新建 task 默认生成执行合同；历史 task 仍可被兼容解析；`/tasks` 主表和展开态已按合同视角与机器事实分层显示；校验器只再要求合同核心字段。
- 复盘：
  task 只保留执行合同，人和 AI 在执行时真正需要的信息留在正文；分支、提交、release、trace 等机器事实应继续留在 companion / release / projection，不再回流到 task 文档。
