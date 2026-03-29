const { getTaskModeLabel, transitionTaskMachine } = require("../../../shared/task-state-machine.ts");
const { updateCompanion } = require("./task-meta.ts");
const { recordHarnessTaskTransition } = require("../../harness/lib.ts");

function applyTaskTransition(taskId, eventId, options = {}) {
  const result = updateCompanion(taskId, (companion) => {
    companion.machine = transitionTaskMachine(companion.machine, eventId, {
      ...options,
      root: process.cwd(),
    });
    companion.current_mode = getTaskModeLabel(companion.machine.mode_id, process.cwd());
    return companion;
  });
  if (result.ok) {
    recordHarnessTaskTransition(taskId, result.companion, options.source || "coord:task:transition");
  }
  return result;
}

module.exports = {
  applyTaskTransition,
};
