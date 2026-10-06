# ADR-0005: Switch animation clips on arrival, not on timers

- Status: Accepted, 2026-10-05
- References: [R1.3](../01-references.md)

## Context
R1 plays `Falling` on every section change and schedules `Typing`/`Standing` 600 ms later with a `setTimeout` that is
never cleared. Scrolling through several sections quickly queues several timers; the last to fire can set a clip
for a section the avatar has already left.

## Decision
A pure function chooses the clip from current facts only: intro phase, whether the avatar is still moving (distance to
target > 4 px), the stop's clip, reduced motion, and whether a once-only clip finished (mixer `finished` event).
`GuideAvatar` calls it every frame and crossfades only when the answer changes.

## Consequences
+ No stale state: the clip always matches where the avatar is now.
+ Fully unit-testable (`clipMachine.test.ts`).
- "Moving" depends on a distance threshold; a target that keeps shifting (resizing the window) keeps the avatar in
  Travel until it settles. Acceptable.
