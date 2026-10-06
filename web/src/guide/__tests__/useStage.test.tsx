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
});
