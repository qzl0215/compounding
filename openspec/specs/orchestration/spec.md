# Orchestration Spec

This capability defines the shared Studio read model.

## Purpose

- Aggregate harness, delivery, project-state, and home into one orchestration snapshot.

## Invariants

- Home, Tasks, Releases, and `/harness` read the same snapshot.
- Orchestration only aggregates; it does not mutate task, release, or runtime state.

## Inputs

- Harness live snapshot
- Delivery snapshot
- Project state snapshot
- Home logic board snapshot

## Output

- `OrchestrationSnapshot` with `harness`, `delivery`, `projectState`, and `home`.

## Acceptance

- The same orchestration snapshot can power all main Studio pages.
- Page-specific summaries remain derivable from the same snapshot.
- Critical orchestration scenarios remain mapped in the harness parity ledger so page readers do not drift independently.
