# tasks

## 模块目标

负责把 `tasks/queue/*` 解析成轻量项目管理清单，供首页摘要和任务页统一使用。

## 输入

- `tasks/queue/*.md`
- `tasks/templates/task-template.md`

## 输出

- 任务卡片
- 状态分组
- Git 运行态
- 更新痕迹摘要
- 交付摘要与差异感知产物入口

## 关键职责

- 统一解析任务标题、目标、状态、分支、最近提交、关联模块和更新痕迹
- 把任务按 `todo / doing / blocked / done` 分组
- 结合 Git 运行态判断任务是否开发中、已提交、已合并或出现状态漂移
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
