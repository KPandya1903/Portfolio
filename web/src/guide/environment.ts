import { guideStore, type GuideStore } from "./store";

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

/** Single owner of the rail marker; the inline script in app/layout.tsx mirrors the "off" write before paint. */
export function setRailFreed(freed: boolean) {
  if (freed) document.documentElement.dataset.guide = "off";
  else delete document.documentElement.dataset.guide;
}

export function hasWebGL(): boolean {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

const mediaMatches = (query: string) => window.matchMedia(query).matches;

/** Called once before the guide chunk mounts, so a returning session never flashes the intro. */
export function primeGuideState(
  store: GuideStore = guideStore,
  matches: (query: string) => boolean = mediaMatches,
  webgl: () => boolean = hasWebGL,
) {
  const reduced = matches(REDUCED_QUERY);
  const canRender = webgl();
  // No WebGL is not the visitor's choice: free the rail without persisting anything.
  if (!canRender) setRailFreed(true);
  store.set({
    available: canRender,
    enabled: readStorage("local", GUIDE_ENABLED_KEY) !== "0" && canRender,
    mode: matches(WIDE_QUERY) ? "wide" : "compact",
    reducedMotion: reduced,
  });
  if (reduced) store.dispatchIntro("REDUCED_MOTION");
  else if (readStorage("session", INTRO_SEEN_KEY) === "1") store.dispatchIntro("ALREADY_SEEN");
}

/** A crashed guide reads as off and hides the toggle (a cached failed load makes retry futile): intro done, rail freed, nothing persisted (docs/04 §8). */
export function failGuide(store: GuideStore = guideStore) {
  store.dispatchIntro("FAILED");
  store.set({ enabled: false, available: false });
  setRailFreed(true);
}
