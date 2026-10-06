"use client";
import { useEffect } from "react";
import { REDUCED_QUERY, WIDE_QUERY } from "./environment";
import { guideStore, type GuideStore } from "./store";

/** The slice of MediaQueryList this hook uses; a real MediaQueryList satisfies it. */
export interface MediaQuery {
  readonly matches: boolean;
  addEventListener(type: "change", listener: () => void): void;
  removeEventListener(type: "change", listener: () => void): void;
}
export type MatchMedia = (query: string) => MediaQuery;

const windowMatchMedia: MatchMedia = (query) => window.matchMedia(query);

/** Keeps mode and reduced-motion current when the window or OS setting changes. */
export function useGuideEnvironment(store: GuideStore = guideStore, matchMedia: MatchMedia = windowMatchMedia) {
  useEffect(() => {
    const wide = matchMedia(WIDE_QUERY);
    const reduce = matchMedia(REDUCED_QUERY);
    const sync = () => store.set({ mode: wide.matches ? "wide" : "compact", reducedMotion: reduce.matches });
    wide.addEventListener("change", sync);
    reduce.addEventListener("change", sync);
    return () => {
      wide.removeEventListener("change", sync);
      reduce.removeEventListener("change", sync);
    };
  }, [store, matchMedia]);
}
