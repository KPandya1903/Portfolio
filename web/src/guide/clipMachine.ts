import type { ClipName, IntroPhase, StopClip } from "./types";

export interface ClipInput {
  intro: IntroPhase;
  moving: boolean;
  staging: boolean;
  reducedMotion: boolean;
  stopClip: StopClip;
  finished: ReadonlySet<ClipName>;
  /** A click reaction is pending: wave once (until Wave is finished), then fall back to the stop clip. */
  reacting?: boolean;
}

const RETURN_TO_IDLE: ReadonlySet<ClipName> = new Set<ClipName>(["ThumbsUp"]);

/** Pure: picks the clip from current facts only, so fast scrolling can't leave a stale clip (ADR-0005). */
export function nextClip({ intro, moving, staging, reducedMotion, stopClip, finished, reacting = false }: ClipInput): ClipName {
  if (reducedMotion) return "Idle";
  if (intro === "pending" || intro === "hello") return finished.has("Wave") ? "Talk" : "Wave";
  if (moving) return "Travel";
  if (staging) return "Talk";
  if (reacting && !finished.has("Wave")) return "Wave";
  if (RETURN_TO_IDLE.has(stopClip) && finished.has(stopClip)) return "Idle";
  return stopClip;
}
