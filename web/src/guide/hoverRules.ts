import { HOVER_COOLDOWN_MS, HOVER_LINES } from "./config";

export interface HoverState {
  /** The marked item the mouse is over right now (dwell may still be running). */
  hoverId: string | null;
  /** The item the robot is looking at; outlives hoverId by the leave grace. */
  lookId: string | null;
  /** When the last hover line was spoken (cooldown clock); null before any. */
  lastSayAt: number | null;
}
export interface HoverContext {
  intro: string;
  staging: boolean;
  /** The section is about to stage (or still settling); its line comes first. */
  stagePending: boolean;
  mode: string;
  reducedMotion: boolean;
}
export type HoverEvent =
  | { type: "enter"; id: string; ctx: HoverContext }
  /** Fired by the hook HOVER_DWELL_MS after enter. */
  | { type: "dwell-complete"; id: string; ctx: HoverContext }
  | { type: "leave"; id: string }
  /** Fired by the hook HOVER_LEAVE_MS after leave. */
  | { type: "leave-complete" }
  /** Section change, stage start, or hover no longer allowed. */
  | { type: "reset" };
export interface HoverResult {
  state: HoverState;
  /** A line to speak now. */
  say?: string;
  /** Present only when the look target changed (null: stop looking). */
  lookId?: string | null;
}

export const INITIAL_HOVER: HoverState = { hoverId: null, lookId: null, lastSayAt: null };

/** Hover reactions need the intro done, no stage running or about to start, a wide screen and motion allowed. */
export const hoverAllowed = (c: HoverContext) => c.intro === "done" && !c.staging && !c.stagePending && c.mode === "wide" && !c.reducedMotion;

const stopLooking = (state: HoverState): HoverResult => ({
  state: { ...state, hoverId: null, lookId: null },
  ...(state.lookId !== null && { lookId: null }),
});

/** Pure hover rules: dwell, cooldown and leave delay (the timers live in useHoverReaction). */
export function nextHover(state: HoverState, event: HoverEvent, now: number): HoverResult {
  switch (event.type) {
    case "enter":
      return hoverAllowed(event.ctx) ? { state: { ...state, hoverId: event.id } } : { state };
    case "dwell-complete": {
      if (state.hoverId !== event.id) return { state };
      if (!hoverAllowed(event.ctx)) return stopLooking(state);
      const line = HOVER_LINES[event.id];
      const canSay = line !== undefined && (state.lastSayAt === null || now - state.lastSayAt >= HOVER_COOLDOWN_MS);
      return {
        state: { ...state, lookId: event.id, lastSayAt: canSay ? now : state.lastSayAt },
        ...(canSay && { say: line }),
        ...(state.lookId !== event.id && { lookId: event.id }),
      };
    }
    case "leave":
      return state.hoverId === event.id ? { state: { ...state, hoverId: null } } : { state };
    case "leave-complete":
      return state.hoverId === null && state.lookId !== null ? stopLooking(state) : { state };
    case "reset":
      return stopLooking(state);
  }
}
