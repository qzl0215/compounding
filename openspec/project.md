# OpenSpec in Compounding

OpenSpec is the repository-local spec layer for capability-level specifications and change packages.
It is useful when a change needs to stay legible across sessions, contributors, and future archives.

## What it is for

- Stable capability specs live under `openspec/specs/<capability>/spec.md`.
- Temporary change packages live under `openspec/changes/<slug>/`.
- Archived change packages live under `openspec/changes/archive/`.

## What it is not for

- Not a replacement for `AGENTS.md`.
- Not a replacement for `memory/project/operating-blueprint.md`.
- Not a replacement for `tasks/queue/*` or the task state machine.

## Repository contract

- `AGENTS.md` and `memory/project/*` remain the governing sources.
- `tasks/queue/*` remains the execution contract.
- OpenSpec packages describe capability intent and deltas, not execution state.
- A change package may mirror task scope, but it must never become the plan source.

## Pilot scope

Start with the repo-governance capability, then keep the first product-facing pilot on the shared control plane family:

- `repo-governance` explains how OpenSpec is used in this repo.
- `orchestration` documents the shared Studio read model.
- `harness` documents the single control plane live snapshot.

## Change flow

1. Write a proposal.
2. Write a design.
3. Break the change into tasks.
4. Bind the change to a task contract.
5. Implement the change.
6. Archive the change package.
7. Refresh the stable spec under `openspec/specs/`.

## Validation

Use `pnpm ai:validate-openspec` to check that the project doc, stable specs, change package, and task binding stay consistent.
