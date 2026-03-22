# tasks

## 模块目标

负责把 `tasks/queue/*` 解析成执行合同视图，并与 companion / release 机器事实拼成任务面板数据。

## 输入

- `tasks/queue/*.md`
- `tasks/templates/task-template.md`

## 输出

- 任务执行合同
- 状态分组
- 机器事实投影
- 交付摘要与差异感知产物入口

## 关键职责

- 统一解析任务摘要、边界、完成定义、范围、风险、测试策略和交付结果
- 把任务按 `todo / doing / blocked / done` 分组
- 从 companion / release / Git 运行态拼接机器事实，判断任务是否开发中、已提交、已合并或出现状态漂移
- 为首页和任务页提供同一份任务数据
- 挂接交付摘要与差异感知 QA / Review / Retro 的派生视图

## 依赖

- docs 模块

## 对外暴露接口

- `listTaskCards`
- `getTaskBoard`

## 不该做什么

- 不负责创建任务文件
- 不修改任务状态
- 不直接决定 roadmap 是否变更
