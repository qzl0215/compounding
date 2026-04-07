import type {
  HarnessAction,
  HarnessActionId,
  HarnessActorRole,
  HarnessContract,
  HarnessHygieneState,
  HarnessRuntimeAlignment,
  HarnessWorkflowState,
} from "./types.ts";

function action(
  action_id: HarnessActionId,
  label: string,
  owner: HarnessActorRole,
  task_id: string | null,
  command: string | null,
  reason: string,
): HarnessAction {
  return {
    action_id,
    label,
    owner,
    task_id,
    command,
    reason,
  };
}

export function decideNextHarnessAction(
  contract: HarnessContract | null,
  workflow: HarnessWorkflowState,
  hygiene: HarnessHygieneState,
  runtimeAlignment: HarnessRuntimeAlignment,
): HarnessAction | null {
  if (!contract) {
    return action(
      "materialize_contract",
      "先把意图落成执行合同",
      "agent",
      null,
      "pnpm harness:intent:create",
      "当前还没有可执行合同，控制面无法裁决后续动作。",
    );
  }

  if (hygiene.blockers.length > 0) {
    return action(
      "clean_workspace",
      "先清理执行卫生",
      "human",
      contract.task_id,
      null,
      hygiene.blockers.join("；"),
    );
  }

  if (workflow.state_id === "planning" || workflow.state_id === "ready" || workflow.state_id === "blocked") {
    return action(
      "run_preflight",
      "运行 task preflight",
      "agent",
      contract.task_id,
      `pnpm harness:act --action=run_preflight --taskId=${contract.short_id}`,
      "合同已经存在，下一步应先确认当前工作区、scope 和运行态是否允许进入执行。",
    );
  }

  if (workflow.state_id === "executing") {
    return action(
      "create_handoff",
      "生成 handoff",
      "agent",
      contract.task_id,
      `pnpm harness:act --action=create_handoff --taskId=${contract.short_id}`,
      "当前任务已处于执行态，下一步应把实现结果交给 review。",
    );
  }

  if (workflow.state_id === "review_pending" || workflow.state_id === "reviewing") {
    return action(
      "run_review",
      "运行 review",
      "agent",
      contract.task_id,
      `pnpm harness:act --action=run_review --taskId=${contract.short_id}`,
      "当前合同已经进入评审阶段，下一步应让 review 决定 direct_merge 或 preview_release。",
    );
  }

  if (workflow.state_id === "release_preparing") {
    return action(
      "prepare_release",
      "生成预览发布",
      "agent",
      contract.task_id,
      `pnpm harness:act --action=prepare_release --taskId=${contract.short_id}`,
      "当前合同已经通过 review 并进入 release 准备态。",
    );
  }

  if (workflow.state_id === "acceptance_pending") {
    return action(
      "accept_release",
      "做验收判断",
      "human",
      contract.task_id,
      `pnpm harness:act --action=accept_release --taskId=${contract.short_id}`,
      "当前 dev 预览已经生成，下一步必须由人做通过或驳回判断。",
    );
  }

  if (runtimeAlignment.target_release_id && !runtimeAlignment.aligned) {
    return action(
      "observe_runtime",
      "确认运行态与目标版本对齐",
      "runtime",
      contract.task_id,
      `pnpm harness:act --action=observe_runtime --taskId=${contract.short_id}`,
      runtimeAlignment.reason,
    );
  }

  if (workflow.state_id === "released" && contract.delivery_track === "direct_merge") {
    return action(
      "complete_direct_merge",
      "确认直接合入已完成",
      "agent",
      contract.task_id,
      `pnpm harness:act --action=complete_direct_merge --taskId=${contract.short_id}`,
      "当前合同已 direct_merge 完成，控制面只需确认状态与运行事实一致。",
    );
  }

  return null;
}
