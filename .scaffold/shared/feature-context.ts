export type FeatureContextCheck = {
  label: string;
  commands: string[];
  reason: string;
  source: "module-contract" | "diff-aware";
};

export type FeatureTaskOverlay = {
  taskId: string;
  shortId: string;
  taskPath: string;
  summary: string;
  boundary: string;
  doneWhen: string;
  stateId: string | null;
  modeId: string | null;
  deliveryTrack: string;
};

export type FeatureContextPacket = {
  target_surface: string;
  related_modules: string[];
  must_read: string[];
  likely_files: string[];
  likely_tests: string[];
  required_checks: FeatureContextCheck[];
  recommended_checks: FeatureContextCheck[];
  invariants: string[];
  common_changes: string[];
  task_overlay?: FeatureTaskOverlay | null;
};
