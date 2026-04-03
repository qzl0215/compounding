# Orchestration Spec

This capability defines the shared Studio read model.

## Purpose

- Aggregate harness, delivery, project-state, and home into one orchestration snapshot.
- Expose a canonical `controlPlane` summary without inventing a fourth truth source.

## Invariants

- Home, Tasks, Releases, and `/harness` read the same snapshot.
- `controlPlane` is a projection of harness facts, not independent state.
- Orchestration only aggregates; it does not mutate task, release, or runtime state.

## Inputs

- Harness live snapshot
- Delivery snapshot
- Project state snapshot
- Home logic board snapshot

## Output

- `OrchestrationSnapshot` with `controlPlane`, `harness`, `delivery`, `projectState`, and `home`.

## Acceptance

- The same orchestration snapshot can power all main Studio pages.
- Page-specific summaries remain derivable from the same snapshot.
- Critical orchestration scenarios remain mapped in the harness parity ledger so page readers do not drift independently.
