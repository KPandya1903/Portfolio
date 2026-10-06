"use client";
import { useEffect } from "react";
import { INTRO } from "./config";
import { INTRO_SEEN_KEY, writeStorage } from "./environment";
import { guideStore, useGuide, type GuideStore } from "./store";

/** The only place intro timers live; each is cleared when the phase changes (fixes R1.3's leaked timer). */
export function useIntroSequence(store: GuideStore = guideStore) {
  const intro = useGuide((s) => s.intro, store);

  // The reducer ignores LOAD_TIMEOUT once the model is ready, so no modelReady check is needed here.
  useEffect(() => {
    const t = window.setTimeout(() => store.dispatchIntro("LOAD_TIMEOUT"), INTRO.loadTimeoutMs);
    return () => window.clearTimeout(t);
  }, [store]);

  useEffect(() => {
    document.documentElement.dataset.guideIntro = intro;
    if (intro === "hello") {
      store.say(INTRO.line);
      const t = window.setTimeout(() => store.dispatchIntro("HELLO_DONE"), INTRO.helloMs);
      return () => window.clearTimeout(t);
    }
    if (intro === "leaving") store.set({ bubble: null });
    if (intro === "done") writeStorage("session", INTRO_SEEN_KEY, "1");
  }, [intro, store]);
}
