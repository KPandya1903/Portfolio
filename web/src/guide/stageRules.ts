import { STAGE_HOLD_MS, STAGE_MAX_MS, STAGE_MIN_DWELL_MS, TYPE_CPS } from "./config";
import type { IntroPhase, Mode } from "./types";

export interface StageInput {
  sectionId: string;
  /** Sections already staged this page view. */
  staged: ReadonlySet<string>;
  /** How long the section has been active. */
  dwellMs: number;
  reducedMotion: boolean;
  mode: Mode;
  intro: IntroPhase;
  stageActive: boolean;
  /** A deliberate request (a chip click): overrides only the already-staged and dwell rules. */
  forced?: boolean;
}

/** Pure skip rules for the center stage (docs plan, "Skip stage"). The hero's stage is the intro. */
export function shouldStage({ sectionId, staged, dwellMs, reducedMotion, mode, intro, stageActive, forced = false }: StageInput): boolean {
  if (sectionId === "hero") return false;
  if (reducedMotion || mode === "compact" || intro !== "done" || stageActive) return false;
  if (forced) return true;
  return !staged.has(sectionId) && dwellMs >= STAGE_MIN_DWELL_MS;
}

/** How long a stage lasts: the line's typing time plus the hold, never more than the hard cap. */
export function stageDurationMs(lineLength: number): number {
  return Math.min(STAGE_MAX_MS, (lineLength / TYPE_CPS) * 1000 + STAGE_HOLD_MS);
}
