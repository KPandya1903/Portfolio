import { useSyncExternalStore } from "react";
import { introReducer, type IntroEvent } from "./introMachine";
import { GUIDE_STOPS } from "./config";
import { shouldStage } from "./stageRules";
import type { GuideState, GuideStop } from "./types";

export const INITIAL_STATE: GuideState = {
  available: true,
  enabled: true,
  mode: "wide",
  reducedMotion: false,
  section: null,
  intro: "pending",
  modelReady: false,
  bubble: null,
  stage: null,
};

/** One store, discrete writers only; per-frame code reads getState() (docs/03 §6). */
export function createGuideStore(initial: GuideState = INITIAL_STATE) {
  let state = initial;
  let bubbleKey = 0;
  const listeners = new Set<() => void>();
  const spoken = new Set<string>();
  const staged = new Set<string>();
  let sectionSince = Date.now();

  const set = (partial: Partial<GuideState>) => {
    const keys = Object.keys(partial) as (keyof GuideState)[];
    if (!keys.some((k) => !Object.is(partial[k], state[k]))) return;
    state = { ...state, ...partial };
    listeners.forEach((l) => l());
  };
  const dispatchIntro = (event: IntroEvent) => set({ intro: introReducer(state.intro, event) });
  const say = (text: string) => set({ bubble: { text, key: ++bubbleKey } });
  const speakOnce = (stop: GuideStop) => {
    if (!stop.line || spoken.has(stop.id)) return;
    spoken.add(stop.id);
    say(stop.line);
  };
  /** Would the rules stage this section (only sections with a stop of their own can)? Dwell defaults to the real one. */
  const canStage = (id: string, opts: { forced?: boolean; dwellMs?: number } = {}) =>
    GUIDE_STOPS.some((s) => s.id === id) &&
    shouldStage({
      sectionId: id,
      staged,
      dwellMs: opts.dwellMs ?? Date.now() - sectionSince,
      reducedMotion: state.reducedMotion,
      mode: state.mode,
      intro: state.intro,
      modelReady: state.modelReady,
      stageActive: state.stage !== null,
      forced: opts.forced,
    });

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    set,
    say,
    dispatchIntro,
    setSection(id: string) {
      if (id === state.section) return;
      sectionSince = Date.now();
      // A section change interrupts a running stage (the robot walks back at once).
      const introCutShort = id !== "hero" && state.intro !== "done";
      set({ section: id, bubble: null, stage: null });
      // The section that ended the intro is never staged: the robot is mid-walk to its corner and would bounce back to centre.
      if (introCutShort) staged.add(id);
      if (id !== "hero") dispatchIntro("LEFT_HERO");
    },
    /** Sections staged this page view (a section is never staged twice). */
    staged: staged as ReadonlySet<string>,
    /** How long the current section has been active, for the stage's fast-scroll rule. */
    dwellMs: () => Date.now() - sectionSince,
    canStage,
    startStage(id: string) {
      staged.add(id);
      set({ stage: { sectionId: id } });
      const stop = GUIDE_STOPS.find((s) => s.id === id);
      if (stop) speakOnce(stop);
    },
    /** The stage was not (or will not be) played: say the section's line from the corner instead, once. Waits for the intro and the model so the bubble can show. */
    skipStage(id: string) {
      if (state.intro !== "done" || !state.modelReady) return;
      const stop = GUIDE_STOPS.find((s) => s.id === id);
      if (stop) speakOnce(stop);
    },
    endStage() {
      set({ stage: null });
    },
    markModelReady() {
      set({ modelReady: true });
      dispatchIntro("MODEL_READY");
    },
    arrive(stop: GuideStop) {
      if (state.intro === "leaving") dispatchIntro("ARRIVED");
      if (state.intro !== "done") return;
      // A section about to stage says its line from the stage instead; stop.id === section excludes e.g. LinkedIn.
      if (stop.id === state.section && canStage(stop.id, { dwellMs: Infinity })) return;
      speakOnce(stop);
    },
  };
}

export type GuideStore = ReturnType<typeof createGuideStore>;
export const guideStore = createGuideStore();

export function useGuide<T>(selector: (s: GuideState) => T, store: GuideStore = guideStore): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(INITIAL_STATE),
  );
}
