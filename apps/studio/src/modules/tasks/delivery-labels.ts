import type { TaskDeliveryStatus } from "./types";

export const TASK_DELIVERY_LABELS: Record<TaskDeliveryStatus, string> = {
  not_started: "待开始",
  in_progress: "进行中",
  pending_acceptance: "待验收",
  released: "已发布",
  rolled_back: "已回滚",
  blocked: "已阻塞",
};
