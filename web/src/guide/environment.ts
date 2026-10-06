import { guideStore } from "./store";

export const WIDE_QUERY = "(min-width: 1280px)";
export const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
export const GUIDE_ENABLED_KEY = "guide:enabled";
export const INTRO_SEEN_KEY = "guide:intro-seen";

type Area = "local" | "session";
const area = (a: Area) => (a === "local" ? window.localStorage : window.sessionStorage);

// Storage can throw (private mode, blocked site data): never let that break the page (R5.1).
export function readStorage(a: Area, key: string): string | null {
  try {
    return area(a).getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(a: Area, key: string, value: string) {
  try {
    area(a).setItem(key, value);
  } catch {
    /* not persisted */
  }
}

export function hasWebGL(): boolean {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

/** Called once before the guide chunk mounts, so a returning session never flashes the intro. */
export function primeGuideState() {
  const reduced = window.matchMedia(REDUCED_QUERY).matches;
  guideStore.set({
    enabled: readStorage("local", GUIDE_ENABLED_KEY) !== "0" && hasWebGL(),
    mode: window.matchMedia(WIDE_QUERY).matches ? "wide" : "compact",
    reducedMotion: reduced,
  });
  if (reduced) guideStore.dispatchIntro("REDUCED_MOTION");
  else if (readStorage("session", INTRO_SEEN_KEY) === "1") guideStore.dispatchIntro("ALREADY_SEEN");
}
