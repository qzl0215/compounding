# 任务状态机主导运行规范重构

## 任务摘要

- 任务 ID：`task-079`
- 短编号：`t-079`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  任务状态机主导运行规范重构
- 为什么现在：
  当前 task、companion、release、portal 存在多套并行状态语义，已经阻碍自动编排和上下文收口。
- 承接边界：
  把任务状态收口成单一 machine-readable 主源，并让 coord/review/release/portal/context 都从它派生；历史 task 保持兼容读取。
- 完成定义：
  新 task 默认从 planning 创建并由编排器自动驱动状态转移；门户、上下文和文档只读 canonical state；历史 task 不迁移也能被稳定映射。
- 交付轨道：`undetermined`

## 执行合同

### 要做

- 新增任务状态机规范、schema、loader 与共享类型
- 重构 companion/coord/review/release/portal/context 派生逻辑
- 更新任务模板、operator contract 与主干文档
- 补状态转移与兼容回归测试

### 不做

- 不批量迁移历史 task 正文
- 不重做 bootstrap attach/bootstrap mode 体系
- 不新增数据库或后台服务

### 约束

- 只让新 task 使用新状态机写入
- 历史 task 保持兼容读取
- release 轨道继续区分 `direct_merge` 与 `preview_release`
- `lifecycle` 与 `task-activity` 只保留为遥测与历史

### 关键风险

如果 canonical state 与派生状态并存过久，portal 和脚本会继续产生语义分叉；如果兼容层处理不完整，历史 task 会被误判。

### 测试策略

- 为什么测：这是结构性改动，会同时影响任务创建、状态转移、门户展示、上下文装配和发布链，需要锁住主链与兼容链。
- 测什么：- schema/loader 校验
  - 新 task 初始化与 override transition
  - direct_merge 与 preview_release 两条主转移链
  - 历史 task 兼容派生与门户 stage 派生
- 不测什么：- 不做历史 task 批量回写
  - 不扩到 bootstrap 外部项目联调
- 当前最小集理由：先保护 canonical state、自动转移和 UI 派生一致性，避免多套状态语义继续回流。

## 交付结果

- 状态：
- 体验验收结果：
  
- 交付结果：
  
- 复盘：
  

## 分支

`codex/task-079-state-machine`

## 关联模块

- `AGENTS.md`
- `apps/studio/src/modules/tasks/`
- `apps/studio/src/modules/portal/`
- `apps/studio/src/modules/project-state/`
- `bootstrap/`
- `docs/`
- `kernel/`
- `package.json`
- `schemas/`
- `scripts/ai/`
- `scripts/pre_mutation_check.py`
- `scripts/coord/`
- `scripts/release/`
- `shared/`
- `tasks/templates/`
- `templates/`
- `tests/`

## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：no change: 未更新
