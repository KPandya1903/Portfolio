// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GUIDE_STOPS, STAGE_MAX_MS, STAGE_MIN_DWELL_MS } from "../config";
import { createGuideStore, type GuideStore } from "../store";
import { useStage } from "../useStage";

const line = (id: string) => GUIDE_STOPS.find((s) => s.id === id)!.line;
let store: GuideStore;
beforeEach(() => {
  vi.useFakeTimers();
  delete document.documentElement.dataset.guideStage;
  store = createGuideStore();
  store.set({ intro: "done", modelReady: true });
});
afterEach(() => vi.useRealTimers());

const start = () => renderHook(() => useStage(store));
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const go = (id: string) => act(() => store.setSection(id));
const stage = () => store.getState().stage?.sectionId ?? null;

describe("useStage", () => {
  it("stages a new section once it has been active for the minimum dwell, saying its line", () => {
    start();
    go("experience");
    tick(STAGE_MIN_DWELL_MS - 1);
    expect(stage()).toBeNull();
    tick(1);
    expect(stage()).toBe("experience");
    expect(store.getState().bubble?.text).toBe(line("experience"));
  });

  it("skips a section scrolled through faster than the dwell", () => {
    start();
    go("experience");
    tick(300);
    go("hero");
    tick(10_000);
    expect(stage()).toBeNull();
    expect(store.staged.has("experience")).toBe(false);
  });

  it("ends the stage at the max duration", () => {
    start();
    go("experience");
    tick(STAGE_MIN_DWELL_MS);
    tick(STAGE_MAX_MS - 1);
    expect(stage()).toBe("experience");
    tick(1);
    expect(stage()).toBeNull();
  });

  it("is interrupted by a section change, then stages the new section after its own dwell", () => {
    start();
    go("experience");
    tick(STAGE_MIN_DWELL_MS + 1000);
    go("projects");
    expect(stage()).toBeNull();
    tick(STAGE_MIN_DWELL_MS);
    expect(stage()).toBe("projects");
    // The interrupted stage's end timer must not cut the new one short.
    tick(STAGE_MAX_MS - 1);
    expect(stage()).toBe("projects");
  });

  it("never stages the hero", () => {
    start();
    go("hero");
    tick(10_000);
    expect(stage()).toBeNull();
  });

  it("stages a section only once per page view", () => {
    start();
    go("experience");
    tick(STAGE_MIN_DWELL_MS);
    tick(STAGE_MAX_MS);
    expect(stage()).toBeNull();
    go("projects");
    tick(STAGE_MIN_DWELL_MS);
    tick(STAGE_MAX_MS);
    go("experience");
    tick(10_000);
    expect(stage()).toBeNull();
  });

  it("does not stage under reduced motion", () => {
    store.set({ reducedMotion: true });
    start();
    go("experience");
    tick(10_000);
    expect(stage()).toBeNull();
  });

  it("does not stage in compact mode", () => {
    store.set({ mode: "compact" });
    start();
    go("experience");
    tick(10_000);
    expect(stage()).toBeNull();
  });

  it("does not stage a section with no stop of its own", () => {
    start();
    go("linkedin");
    tick(10_000);
    expect(stage()).toBeNull();
  });

  it("mirrors the stage onto <html> and clears it", () => {
    start();
    go("experience");
    tick(STAGE_MIN_DWELL_MS);
    expect(document.documentElement.dataset.guideStage).toBe("experience");
    tick(STAGE_MAX_MS);
    expect(document.documentElement.dataset.guideStage).toBeUndefined();
  });

  it("clears the stage, attribute and timers on unmount", () => {
    const { unmount } = start();
    go("experience");
    tick(STAGE_MIN_DWELL_MS);
    unmount();
    expect(stage()).toBeNull();
    expect(document.documentElement.dataset.guideStage).toBeUndefined();
    go("projects");
    const again = start();
    again.unmount();
    tick(10_000);
    expect(stage()).toBeNull();
  });

  it("starts no stage from a timer left behind by an unmounted hook", () => {
    const { unmount } = start();
    go("experience");
    tick(STAGE_MIN_DWELL_MS - 10);
    unmount();
    tick(10_000);
    expect(stage()).toBeNull();
  });

  it("stages on the timer even if Date.now lags the fake timers by a millisecond", () => {
    start();
    go("experience");
    const lagged = Date.now() + STAGE_MIN_DWELL_MS - 1;
    const spy = vi.spyOn(Date, "now").mockReturnValue(lagged);
    tick(STAGE_MIN_DWELL_MS);
    spy.mockRestore();
    expect(stage()).toBe("experience");
  });

  it("speaks the line from the corner when compact mode switches on inside the dwell window", () => {
    start();
    go("experience");
    tick(300);
    act(() => store.set({ mode: "compact" }));
    tick(STAGE_MIN_DWELL_MS);
    expect(stage()).toBeNull();
    expect(store.getState().bubble?.text).toBe(line("experience"));
  });

  it("speaks the line from the corner when reduced motion switches on inside the dwell window", () => {
    start();
    go("experience");
    tick(300);
    act(() => store.set({ reducedMotion: true }));
    tick(STAGE_MIN_DWELL_MS);
    expect(stage()).toBeNull();
    expect(store.getState().bubble?.text).toBe(line("experience"));
  });

  it("waits for the model: no stage and no spoken line until it renders, then stages and speaks", () => {
    store.set({ modelReady: false });
    start();
    go("experience");
    tick(10_000);
    expect(stage()).toBeNull();
    expect(store.getState().bubble).toBeNull();
    act(() => store.markModelReady());
    tick(0);
    expect(stage()).toBe("experience");
    expect(store.getState().bubble?.text).toBe(line("experience"));
  });

  it("still speaks a skipped section's line once the model renders", () => {
    store.set({ modelReady: false, mode: "compact" });
    start();
    go("experience");
    tick(10_000);
    expect(store.getState().bubble).toBeNull();
    act(() => store.markModelReady());
    tick(0);
    expect(stage()).toBeNull();
    expect(store.getState().bubble?.text).toBe(line("experience"));
  });

  it("ends a running stage when compact mode switches on", () => {
    start();
    go("experience");
    tick(STAGE_MIN_DWELL_MS);
    expect(stage()).toBe("experience");
    act(() => store.set({ mode: "compact" }));
    expect(stage()).toBeNull();
  });

  it("ends a running stage when reduced motion switches on", () => {
    start();
    go("experience");
    tick(STAGE_MIN_DWELL_MS);
    expect(stage()).toBe("experience");
    act(() => store.set({ reducedMotion: true }));
    expect(stage()).toBeNull();
  });

  it("does not stage the section that cut the intro short (no bounce back to centre), but speaks its line", () => {
    store.set({ intro: "leaving" });
    start();
    go("about");
    tick(10_000);
    expect(stage()).toBeNull();
    expect(store.getState().bubble?.text).toBe(line("about"));
  });
});
