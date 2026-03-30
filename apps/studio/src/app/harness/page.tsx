import { PageHeader } from "@/components/ui/page-header";
import { HarnessBoard } from "@/modules/harness";
import { getOrchestrationSnapshot } from "@/modules/orchestration";

export const dynamic = "force-dynamic";

export default async function HarnessPage() {
  const snapshot = await getOrchestrationSnapshot();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="单一控制平面"
        title="这里回答唯一问题：现在该做什么，为什么"
        description={snapshot.harness.next_action ? snapshot.harness.next_action.reason : "当前没有待执行动作。"}
        note={snapshot.harness.active_contract ? `${snapshot.harness.active_contract.short_id} ${snapshot.harness.active_contract.title}` : "当前没有 active contract。"}
        metrics={[
          {
            label: "workflow",
            value: snapshot.harness.state.workflow.state_label,
            tone: snapshot.harness.state.workflow.state_id === "blocked" ? "danger" : "accent",
          },
          {
            label: "next action",
            value: snapshot.harness.next_action?.label || "无",
            tone: snapshot.harness.next_action ? "warning" : "success",
          },
          {
            label: "target release",
            value: snapshot.harness.state.runtime_alignment.target_release_id || "无",
            tone: snapshot.harness.state.runtime_alignment.aligned ? "success" : "warning",
          },
        ]}
      />
      <HarnessBoard snapshot={snapshot.harness} />
    </div>
  );
}
