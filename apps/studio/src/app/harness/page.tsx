import { PageHeader } from "@/components/ui/page-header";
import { HarnessBoard, getHarnessLiveSnapshot } from "@/modules/harness";

export const dynamic = "force-dynamic";

export default async function HarnessPage() {
  const snapshot = getHarnessLiveSnapshot();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="单一控制平面"
        title="这里回答唯一问题：现在该做什么，为什么"
        description={snapshot.next_action ? snapshot.next_action.reason : "当前没有待执行动作。"}
        note={snapshot.active_contract ? `${snapshot.active_contract.short_id} ${snapshot.active_contract.title}` : "当前没有 active contract。"}
        metrics={[
          {
            label: "workflow",
            value: snapshot.state.workflow.state_label,
            tone: snapshot.state.workflow.state_id === "blocked" ? "danger" : "accent",
          },
          {
            label: "next action",
            value: snapshot.next_action?.label || "无",
            tone: snapshot.next_action ? "warning" : "success",
          },
          {
            label: "target release",
            value: snapshot.state.runtime_alignment.target_release_id || "无",
            tone: snapshot.state.runtime_alignment.aligned ? "success" : "warning",
          },
        ]}
      />
      <HarnessBoard snapshot={snapshot} />
    </div>
  );
}
