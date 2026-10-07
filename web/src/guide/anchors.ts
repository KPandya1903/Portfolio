import type { IntroPhase, Mode } from "./types";

export interface Viewport {
  w: number;
  h: number;
}
export interface Anchor {
  x: number;
  y: number;
  heightPx: number;
}

export const WIDE_MIN_WIDTH = 1280;
const REST_HEIGHT = { wide: 140, compact: 120 } as const;
const REST_INSET = 16;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const modeForWidth = (w: number): Mode => (w >= WIDE_MIN_WIDTH ? "wide" : "compact");

/** Where the avatar's vertical centre should be, in CSS pixels from the top-left (docs/04 §3). */
export function resolveAnchor(mode: Mode, intro: IntroPhase, staging: boolean, v: Viewport): Anchor {
  if (intro === "pending" || intro === "hello") {
    return mode === "wide"
      ? { x: v.w / 2, y: 0.52 * v.h, heightPx: clamp(0.55 * v.h, 320, 520) }
      : { x: v.w / 2, y: 0.5 * v.h, heightPx: 0.4 * v.h };
  }
  // Center stage: same centre as the intro, a little smaller (compact never stages; the guard keeps the maths total).
  if (staging) return { x: v.w / 2, y: 0.52 * v.h, heightPx: clamp(0.45 * v.h, 260, 420) };
  // Resting spot: bottom-left corner, same for every stop.
  const heightPx = REST_HEIGHT[mode];
  return { x: REST_INSET + 0.3 * heightPx, y: v.h - REST_INSET - heightPx / 2, heightPx };
}

/** Orthographic camera, zoom 1: one world unit is one CSS pixel, origin at the viewport centre (ADR-0002). */
export const pxToWorld = (p: { x: number; y: number }, v: Viewport) => ({ x: p.x - v.w / 2, y: v.h / 2 - p.y });

export const worldToPx = (p: { x: number; y: number }, v: Viewport) => ({ x: p.x + v.w / 2, y: v.h / 2 - p.y });

/** A target closer than this to the avatar's x leaves the body facing forward (no swing as the target crosses it). */
export const YAW_DEADZONE_PX = 40;

/** Turn toward the target's side of the avatar; face forward without one or inside the deadzone (docs/02 §5). */
export function yawToward(targetCenterX: number | null, avatarX: number, maxYaw: number): number {
  if (targetCenterX === null) return 0;
  const dx = targetCenterX - avatarX;
  return Math.abs(dx) < YAW_DEADZONE_PX ? 0 : Math.sign(dx) * maxYaw;
}

const BUBBLE_MARGIN = 12;

/** Bubble sits centred above the head, kept 12 px inside the viewport (docs/02 §3). */
export function bubbleBox(anchor: { x: number; top: number }, width: number, viewportW: number) {
  const left = Math.min(Math.max(BUBBLE_MARGIN, anchor.x - width / 2), viewportW - width - BUBBLE_MARGIN);
  return { left, top: anchor.top - BUBBLE_MARGIN };
}
