# ADR-0001: Native scroll with a fixed overlay canvas, not ScrollControls

- Status: Accepted, 2026-10-05
- References: [R1.7](../01-references.md), [R2.1](../01-references.md), [R2.3](../01-references.md)

## Context
The primary reference ([R1.7]) puts the whole page inside the WebGL canvas with drei `ScrollControls`: a custom
scroll container, every section exactly one screen tall, HTML rendered through `<Scroll html>`. Kunj's content has
sections of very different heights (Journey's timeline, a project carousel) and must stay readable by recruiters,
crawlers and screen readers.

## Decision
Render all content as normal server HTML with native document scrolling. Draw the avatar on one fixed, transparent,
`pointer-events: none` canvas layered above the content, as sen-3d-resume does with its background canvas ([R2.1]).
Read the active section from the DOM with an IntersectionObserver ([R2.3] reads the DOM too, per frame).

## Consequences
+ Sections keep any height; anchor links, find-in-page, keyboard scrolling and screen readers behave normally.
+ Content is in the static HTML (SEO, no-JS).
+ The guide can be turned off entirely without affecting content.
- The avatar cannot be "inside" the scene with content (no 3D project cards like R1's carousel). Accepted: not a goal.
- The canvas sits above content, so the avatar can cover content; handled by keeping the resting robot small (140 px, 120 px on compact) in the bottom-left corner ([02 layout]), with one transparent button over it as the only click target.
