"use client";
import { useEffect } from "react";
import { INTRO } from "./config";
import { INTRO_SEEN_KEY, writeStorage } from "./environment";
import { guideStore, useGuide } from "./store";

/** The only place intro timers live; each is cleared when the phase changes (fixes R1.3's leaked timer). */
export function useIntroSequence() {
  const intro = useGuide((s) => s.intro);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!guideStore.getState().modelReady) guideStore.dispatchIntro("LOAD_TIMEOUT");
    }, INTRO.loadTimeoutMs);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.guideIntro = intro;
    if (intro === "hello") {
      guideStore.say(INTRO.line);
      const t = window.setTimeout(() => guideStore.dispatchIntro("HELLO_DONE"), INTRO.helloMs);
      return () => window.clearTimeout(t);
    }
    if (intro === "leaving") guideStore.set({ bubble: null });
    if (intro === "done") writeStorage("session", INTRO_SEEN_KEY, "1");
  }, [intro]);
}
