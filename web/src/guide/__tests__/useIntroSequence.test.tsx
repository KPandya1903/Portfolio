// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INTRO } from "../config";
import { INTRO_SEEN_KEY } from "../environment";
import { createGuideStore, type GuideStore } from "../store";
import { useIntroSequence } from "../useIntroSequence";

let store: GuideStore;
beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  delete document.documentElement.dataset.guideIntro;
  store = createGuideStore();
});
afterEach(() => vi.useRealTimers());

const start = () => renderHook(() => useIntroSequence(store));
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("useIntroSequence", () => {
  it("mirrors the intro phase onto <html> for the hero-dimming CSS", () => {
    start();
    expect(document.documentElement.dataset.guideIntro).toBe("pending");
    act(() => store.markModelReady());
    expect(document.documentElement.dataset.guideIntro).toBe("hello");
  });

  it("says the intro line when hello starts", () => {
    start();
    act(() => store.markModelReady());
    expect(store.getState().bubble?.text).toBe(INTRO.line);
  });

  it("leaves after the hello duration and clears the bubble", () => {
    start();
    act(() => store.markModelReady());
    tick(INTRO.helloMs);
    expect(store.getState().intro).toBe("leaving");
    expect(store.getState().bubble).toBeNull();
  });

  it("remembers the intro for this session once done", () => {
    start();
    act(() => store.dispatchIntro("ALREADY_SEEN"));
    expect(sessionStorage.getItem(INTRO_SEEN_KEY)).toBe("1");
  });

  it("gives up on the intro if the model never loads", () => {
    start();
    tick(INTRO.loadTimeoutMs);
    expect(store.getState().intro).toBe("done");
  });

  it("keeps the intro if the model loaded in time", () => {
    start();
    act(() => store.markModelReady());
    tick(INTRO.loadTimeoutMs);
    // helloMs may elapse too (both are 4 s), so assert only that the timeout did not end the intro.
    expect(store.getState().intro).not.toBe("done");
  });
});
