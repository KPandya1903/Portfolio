import type { GuideStop, IntroPhase, Mode } from "./types";

export interface Viewport {
  w: number;
  h: number;
}
export interface Anchor {
  x: number;
  y: number;
  heightPx: number;
}

export const RAIL_WIDTH = 280;
export const WIDE_MIN_WIDTH = 1280;
const COMPACT_HEIGHT = 120;
const COMPACT_INSET = 16;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const modeForWidth = (w: number): Mode => (w >= WIDE_MIN_WIDTH ? "wide" : "compact");

/** Where the avatar's vertical centre should be, in CSS pixels from the top-left (docs/04 §3). */
export function resolveAnchor(stop: GuideStop, mode: Mode, intro: IntroPhase, v: Viewport): Anchor {
  if (intro === "pending" || intro === "hello") {
    return mode === "wide"
      ? { x: v.w / 2, y: 0.52 * v.h, heightPx: clamp(0.55 * v.h, 320, 520) }
      : { x: v.w / 2, y: 0.5 * v.h, heightPx: 0.4 * v.h };
  }
  if (mode === "wide") {
    return { x: RAIL_WIDTH / 2, y: stop.wide.y * v.h, heightPx: clamp(0.42 * v.h, 260, 420) };
  }
  return {
    x: COMPACT_INSET + 0.3 * COMPACT_HEIGHT,
    y: v.h - COMPACT_INSET - COMPACT_HEIGHT / 2,
    heightPx: COMPACT_HEIGHT,
  };
}

/** Orthographic camera, zoom 1: one world unit is one CSS pixel, origin at the viewport centre (ADR-0002). */
export const pxToWorld = (p: { x: number; y: number }, v: Viewport) => ({ x: p.x - v.w / 2, y: v.h / 2 - p.y });
