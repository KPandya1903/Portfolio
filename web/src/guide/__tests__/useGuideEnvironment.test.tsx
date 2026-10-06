// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { REDUCED_QUERY, WIDE_QUERY } from "../environment";
import { createGuideStore } from "../store";
import { useGuideEnvironment, type MatchMedia } from "../useGuideEnvironment";

/** Minimal MediaQueryList fake: happy-dom's never fires "change". */
function fakeMedia(initial: Record<string, boolean>) {
  const state = { ...initial };
  const listeners = new Map<string, Set<() => void>>();
  const matchMedia: MatchMedia = (query) => ({
    get matches() {
      return state[query] ?? false;
    },
    addEventListener: (_: "change", fn: () => void) => void (listeners.get(query) ?? listeners.set(query, new Set()).get(query)!).add(fn),
    removeEventListener: (_: "change", fn: () => void) => void listeners.get(query)?.delete(fn),
  });
  const change = (query: string, matches: boolean) => {
    state[query] = matches;
    listeners.get(query)?.forEach((fn) => fn());
  };
  const listenerCount = () => [...listeners.values()].reduce((n, s) => n + s.size, 0);
  return { matchMedia, change, listenerCount };
}

describe("useGuideEnvironment", () => {
  it("switches to compact when the window narrows below 1280 px", () => {
    const store = createGuideStore();
    const media = fakeMedia({ [WIDE_QUERY]: true });
    renderHook(() => useGuideEnvironment(store, media.matchMedia));
    act(() => media.change(WIDE_QUERY, false));
    expect(store.getState().mode).toBe("compact");
  });

  it("picks up a reduced-motion change in the OS", () => {
    const store = createGuideStore();
    const media = fakeMedia({ [WIDE_QUERY]: true });
    renderHook(() => useGuideEnvironment(store, media.matchMedia));
    act(() => media.change(REDUCED_QUERY, true));
    expect(store.getState().reducedMotion).toBe(true);
  });

  it("stops listening on unmount", () => {
    const media = fakeMedia({});
    const { unmount } = renderHook(() => useGuideEnvironment(createGuideStore(), media.matchMedia));
    expect(media.listenerCount()).toBe(2);
    unmount();
    expect(media.listenerCount()).toBe(0);
  });
});
