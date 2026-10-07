export type ClipName = "Wave" | "Talk" | "Point" | "Idle" | "Travel" | "ThumbsUp";
export type StopClip = Exclude<ClipName, "Travel" | "Wave">;
export type Mode = "wide" | "compact";
export type BubbleKind = "line" | "hover";
export type IntroPhase = "pending" | "hello" | "leaving" | "done";

export interface GuideStop {
  id: string;
  clip: StopClip;
  target?: string;
  line?: string;
  source?: string;
}

export interface ModelConfig {
  url: string;
  clipMap: Record<ClipName, string>;
  once: ClipName[];
  /** Name of the head bone the look-at offset is applied to. */
  headBone: string;
}

export interface GuideState {
  available: boolean;
  enabled: boolean;
  mode: Mode;
  reducedMotion: boolean;
  section: string | null;
  intro: IntroPhase;
  modelReady: boolean;
  /** `line` is announced to screen readers; a `hover` line is shown but not (it would interrupt whatever the user is reading). */
  bubble: { text: string; key: number; kind: BubbleKind } | null;
  /** Center stage in progress for this section (docs/superpowers/plans/2026-10-06-interactive-guide.md), or null. */
  stage: { sectionId: string } | null;
  /** The marked item the robot is looking at because of a hover (the avatar derives the gaze from it), or null. */
  hover: { id: string } | null;
  /** The quick-jump menu (opened from the robot) is open. */
  menuOpen: boolean;
  /** A one-shot reaction to a click on the robot; a new key replays it. */
  reaction: { clip: "Wave"; key: number } | null;
  /** A chip asked for this section to be staged (forced) once it becomes active. */
  forcedStage: string | null;
}
