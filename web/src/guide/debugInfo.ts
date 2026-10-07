/** Per-frame readout for the dev-only overlay; written by the avatar (non-production builds only), not React state. */
export const debugInfo = {
  clip: "",
  stopId: "",
  /** Where the avatar is heading (resolved anchor), in px. */
  anchorX: 0,
  anchorY: 0,
  heightPx: 0,
  /** Where the avatar is right now, in px. */
  x: 0,
  y: 0,
  curHeightPx: 0,
  /** What the head looks at: a "hover"ed item, the mouse "cursor", the section "target" or "none". */
  gaze: "none",
};
