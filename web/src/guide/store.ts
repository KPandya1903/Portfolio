import { useSyncExternalStore } from "react";
import { introReducer, type IntroEvent } from "./introMachine";
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
};

/** One store, discrete writers only; per-frame code reads getState() (docs/03 §6). */
export function createGuideStore(initial: GuideState = INITIAL_STATE) {
  let state = initial;
  let bubbleKey = 0;
  const listeners = new Set<() => void>();
  const spoken = new Set<string>();

  const set = (partial: Partial<GuideState>) => {
    const keys = Object.keys(partial) as (keyof GuideState)[];
    if (!keys.some((k) => !Object.is(partial[k], state[k]))) return;
    state = { ...state, ...partial };
    listeners.forEach((l) => l());
  };
  const dispatchIntro = (event: IntroEvent) => set({ intro: introReducer(state.intro, event) });
  const say = (text: string) => set({ bubble: { text, key: ++bubbleKey } });

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
      set({ section: id, bubble: null });
      if (id !== "hero") dispatchIntro("LEFT_HERO");
    },
    markModelReady() {
      set({ modelReady: true });
      dispatchIntro("MODEL_READY");
    },
    arrive(stop: GuideStop) {
      if (state.intro === "leaving") dispatchIntro("ARRIVED");
      if (state.intro !== "done" || !stop.line || spoken.has(stop.id)) return;
      spoken.add(stop.id);
      say(stop.line);
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
