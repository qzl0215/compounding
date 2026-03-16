# releases

## 模块目标

负责本机/内网发布管理页、release registry 读取、本地生产运行态展示、发布/回滚动作调度，以及发布目录约定的统一入口。

## 输入

- `AI_OS_RELEASE_ROOT`
- `registry.json`
- `releases/<release-id>/`
- `current`
- `shared/`
- `shared/local-prod.json`

## 输出

- release dashboard 数据
- 本地生产运行态
- 管理访问判定
- deploy / rollback 动作结果

## 关键职责

- 读取 release registry
- 读取本地生产运行态
- 判断请求是否来自本机或内网
- 调用发布与回滚脚本
- 给 UI 提供当前激活版本和历史版本摘要

## 依赖

- Node fs
- Node child process
- `scripts/release/*`

## 对外暴露接口

- `getManagementAccessState`
- `getReleaseDashboard`
- `runDeployRelease`
- `runRollbackRelease`

## 不该做什么

- 不负责通用后台系统
- 不负责公网鉴权
- 不直接改写业务文档
