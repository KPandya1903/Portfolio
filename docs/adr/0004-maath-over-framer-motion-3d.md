# ADR-0004: Ease the avatar with maath, not framer-motion-3d or gsap

- Status: Accepted, 2026-10-05
- References: [R1.1](../01-references.md), [R2.5](../01-references.md), [R4.4](../01-references.md), [R7.6](../01-references.md)

## Context
R1 animates the avatar group with `framer-motion-3d` variants. Its latest release (12.4.13) still declares a peer
dependency on `@react-three/fiber` 8.2.2, which needs React 18; we run React 19.3 with R3F 9.8. R4 uses gsap
ScrollTrigger timelines, which scrub transforms by scroll position rather than easing toward a target.

## Decision
Ease position, scale and rotation inside `useFrame` with `maath/easing` (`damp3`, `dampE`, `damp`), which are
frame-rate-independent critical-damping functions, the same idea as R2's `1 - damping^dt`.

## Consequences
+ No dependency pinned to an old React; ~5 KB.
+ The target can change at any frame (resize, new section) and the motion stays continuous: no timeline to rebuild.
- Choreography is code, not a declarative timeline. Kept small by the anchor table in `config.ts`.
