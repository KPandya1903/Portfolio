# ADR-0002: Orthographic camera at 1 world unit = 1 CSS pixel

- Status: Accepted, 2026-10-05
- References: [R1.1](../01-references.md) (hard-coded world positions per section)

## Context
R1 positions the avatar in world units (`y: -viewport.height * 2 + 0.5`), tuned by eye for one window size, so the
avatar drifts relative to content on other sizes. Our anchors are defined in screen space (a corner inset, the screen centre, a fraction
of viewport height), and the speech bubble must be placed at the avatar's head in screen pixels every frame.

## Decision
Use R3F's orthographic camera with `zoom: 1`. R3F sizes its frustum to the canvas in CSS pixels, so world units are
pixels with the origin at the viewport centre. Screen↔world conversion becomes `x - w/2`, `h/2 - y`.

## Consequences
+ Anchor math and bubble placement are plain arithmetic and unit-testable without WebGL.
+ Avatar height is set in pixels and stays the same on any screen.
- No perspective foreshortening. For a single standing character seen head-on this is not noticeable.
- Lights and depth are in pixel units (light positions in the hundreds); documented in GuideCanvas.
