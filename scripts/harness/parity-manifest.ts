const HARNESS_PARITY_MANIFEST = {
  schema_version: "1",
  verification_commands: {
    python_harness_cli: {
      label: "Harness CLI unittest",
      command: "python3 -m unittest tests.test_harness_cli",
    },
    studio_harness_service: {
      label: "Studio harness service Vitest",
      command: "pnpm --filter studio test -- src/modules/harness/__tests__/service.test.ts",
    },
    studio_orchestration_service: {
      label: "Studio orchestration service Vitest",
      command: "pnpm --filter studio test -- src/modules/orchestration/__tests__/service.test.ts",
    },
  },
  scenarios: [
    {
      scenario_id: "intent_contract_materialization",
      label: "create-task 会同步 materialize intent / contract",
      refs: [
        {
          path: "openspec/specs/harness/spec.md",
          pattern: "Harness has one live snapshot and one canonical event stream.",
        },
        {
          path: "apps/studio/src/modules/harness/module.md",
          pattern: "harness 是单一控制平面的只读展示层，不在 Studio 内直接做状态迁移。",
        },
      ],
      verifications: [
        {
          command_id: "python_harness_cli",
          path: "tests/test_harness_cli.py",
          pattern: "def test_create_task_materializes_intent_contract_and_snapshot(self) -> None:",
        },
      ],
    },
    {
      scenario_id: "workflow_transition_updates_next_action",
      label: "状态迁移会同步 workflow 与 next action",
      refs: [
        {
          path: "openspec/specs/harness/spec.md",
          pattern: "Make the next legal action explicit rather than inferred separately in each consumer.",
        },
        {
          path: "apps/studio/src/modules/harness/module.md",
          pattern: "hygiene blocker、workflow state、runtime alignment 和 next action 必须同时出现，不能只展示结论不展示原因。",
        },
      ],
      verifications: [
        {
          command_id: "python_harness_cli",
          path: "tests/test_harness_cli.py",
          pattern: "def test_task_transition_updates_harness_workflow_and_next_action(self) -> None:",
        },
      ],
    },
    {
      scenario_id: "studio_harness_status_parse",
      label: "Studio harness service 读取同一份 CLI snapshot",
      refs: [
        {
          path: "openspec/specs/harness/spec.md",
          pattern: "The CLI and Studio can read the same harness snapshot.",
        },
        {
          path: "apps/studio/src/modules/harness/module.md",
          pattern: "负责把单一控制平面 live snapshot 接入 Studio，并输出 orchestration board，供 orchestration service 统一消费。",
        },
      ],
      verifications: [
        {
          command_id: "studio_harness_service",
          path: "apps/studio/src/modules/harness/__tests__/service.test.ts",
          pattern: 'it("parses canonical harness status output"',
        },
      ],
    },
    {
      scenario_id: "orchestration_shared_snapshot",
      label: "orchestration 共享 harness snapshot 而不是重算真相",
      refs: [
        {
          path: "openspec/specs/orchestration/spec.md",
          pattern: "Home, Tasks, Releases, and `/harness` read the same snapshot.",
        },
        {
          path: "apps/studio/src/modules/orchestration/module.md",
          pattern: "所有 Studio 主要页面必须共读同一份 orchestration snapshot。",
        },
      ],
      verifications: [
        {
          command_id: "studio_orchestration_service",
          path: "apps/studio/src/modules/orchestration/__tests__/service.test.ts",
          pattern: 'it("builds a single shared read model from delivery, project-state and home"',
        },
      ],
    },
  ],
};

module.exports = {
  HARNESS_PARITY_MANIFEST,
};
