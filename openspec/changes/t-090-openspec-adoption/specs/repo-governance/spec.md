# Repo Governance Spec Delta

This change introduces OpenSpec as a repository-local spec layer.

## Added rules

- OpenSpec lives beside the existing governance sources; it does not replace them.
- `openspec/project.md` is the entry point for OpenSpec work in this repo.
- Stable specs live in `openspec/specs/`.
- Change packages live in `openspec/changes/`.
- Archive lives in `openspec/changes/archive/`.

## Boundaries

- Do not treat OpenSpec as a second plan source.
- Do not let OpenSpec replace `AGENTS.md`, `memory/project/operating-blueprint.md`, or `tasks/queue/*`.
- Use the dedicated validator to check consistency between change packages and task bindings.

## Pilot

- The first useful pilot should be on the repo-governance layer and the shared control-plane family (`orchestration` and `harness`).
