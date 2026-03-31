# OpenSpec adoption proposal

## Why now

Compounding already has a single plan source, task contracts, companion context, and release facts.
What is still missing is a repository-local spec layer that can hold long-lived capability specs and transient change packages without becoming a second planning system.

## What changes

- Add `openspec/project.md` as the repo-specific entry point.
- Add stable capability specs under `openspec/specs/`.
- Add a change package under `openspec/changes/t-090-openspec-adoption/`.
- Add a validation command that checks OpenSpec packages against task bindings.

## What does not change

- `AGENTS.md` remains the high-frequency governance source.
- `memory/project/operating-blueprint.md` remains the only plan source.
- `tasks/queue/*` remains the execution contract.
- The task state machine and release flow remain unchanged.

## Success

- OpenSpec can describe repo governance and the first pilot capability family without replacing the current governance chain.
- Change packages and task contracts remain traceable to each other.
- The repository can validate OpenSpec structure with a dedicated command.
