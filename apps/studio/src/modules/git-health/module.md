# git-health

## 模块目标

负责读取 git 当前状态和最近一次 preflight 结果，供首页和文档门户显示。

## 输入

- 当前仓库 git 状态
- `output/agent_session/latest_pre_mutation_check.json`

## 输出

- git head
- git status
- baseline suggestion
- latest preflight payload

## 关键职责

- 读取 git，不修改 git
- 读取 preflight 结果

## 依赖

- Node child process
- Node fs

## 对外暴露接口

- `getGitHistory`
- `getGitStatus`
- `getGitHead`
- `getGitBaselineSuggestion`
- `getLatestPreMutationCheck`

## 不该做什么

- 不执行 mutation
- 不创建 branch
- 不做 task 决策
