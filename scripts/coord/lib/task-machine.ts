const { getTaskModeLabel, transitionTaskMachine } = require("../../../shared/task-state-machine.ts");
const { updateCompanion } = require("./task-meta.ts");

function applyTaskTransition(taskId, eventId, options = {}) {
  return updateCompanion(taskId, (companion) => {
    companion.machine = transitionTaskMachine(companion.machine, eventId, {
      ...options,
      root: process.cwd(),
    });
    companion.current_mode = getTaskModeLabel(companion.machine.mode_id, process.cwd());
    return companion;
  });
}

module.exports = {
  applyTaskTransition,
};
