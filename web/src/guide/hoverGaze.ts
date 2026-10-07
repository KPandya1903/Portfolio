import type { MutableRefObject } from "react";

/** The hovered item's cached centre in CSS px (written by useHoverReaction, read by the avatar's frame loop). */
export const hoverGaze: { center: MutableRefObject<{ x: number; y: number } | null> } = { center: { current: null } };
