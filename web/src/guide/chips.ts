import { RESUME_URL } from "./config";
import type { GuideState, Mode } from "./types";

export type ChipAction =
  | { type: "open"; url: string }
  | { type: "scroll"; id: string; behavior: "smooth" | "auto"; forceStage: boolean };

/**
 * What a chip does. Sections scroll (instantly under reduced motion) and, where the robot can stage at all
 * (wide, motion allowed), ask for a forced stage; compact and reduced motion only scroll.
 */
export function chipAction(target: string, { reducedMotion, mode }: { reducedMotion: boolean; mode: Mode }): ChipAction {
  if (target === "resume") return { type: "open", url: RESUME_URL };
  return { type: "scroll", id: target, behavior: reducedMotion ? "auto" : "smooth", forceStage: !reducedMotion && mode === "wide" };
}

/** The robot is at rest in its corner and the guide is on: only then is there anything to click (hotspot and menu). */
export const menuAllowed = (s: GuideState): boolean => s.available && s.enabled && s.intro === "done" && s.stage === null;
