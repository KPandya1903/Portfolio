export type ClipName = "Wave" | "Talk" | "Point" | "Idle" | "Travel" | "ThumbsUp";
export type StopClip = Exclude<ClipName, "Travel" | "Wave">;
export type Mode = "wide" | "compact";
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
  bubble: { text: string; key: number } | null;
  /** Center stage in progress for this section (docs/superpowers/plans/2026-10-06-interactive-guide.md), or null. */
  stage: { sectionId: string } | null;
  /** The marked item the robot is looking at because of a hover (the avatar derives the gaze from it), or null. */
  hover: { id: string } | null;
}
