"use client";
import { useEffect } from "react";
import { REDUCED_QUERY, WIDE_QUERY } from "./environment";
import { guideStore } from "./store";

/** Keeps mode and reduced-motion current when the window or OS setting changes. */
export function useGuideEnvironment() {
  useEffect(() => {
    const wide = window.matchMedia(WIDE_QUERY);
    const reduce = window.matchMedia(REDUCED_QUERY);
    const sync = () => guideStore.set({ mode: wide.matches ? "wide" : "compact", reducedMotion: reduce.matches });
    wide.addEventListener("change", sync);
    reduce.addEventListener("change", sync);
    return () => {
      wide.removeEventListener("change", sync);
      reduce.removeEventListener("change", sync);
    };
  }, []);
}
