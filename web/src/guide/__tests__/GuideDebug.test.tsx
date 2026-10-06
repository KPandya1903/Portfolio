// @vitest-environment happy-dom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debugInfo } from "../debugInfo";
import { GuideDebug } from "../GuideDebug";
import { createGuideStore, INITIAL_STATE, type GuideStore } from "../store";

let store: GuideStore;
beforeEach(() => {
  vi.useFakeTimers();
  store = createGuideStore({ ...INITIAL_STATE, section: "projects", intro: "done", mode: "compact", reducedMotion: true });
  Object.assign(debugInfo, { clip: "wave", anchorX: 10.4, anchorY: 20.6, heightPx: 300.2, stopId: "hero" });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const panel = () => screen.getByTestId("guide-debug");

describe("GuideDebug", () => {
  it("is a hidden, non-interactive panel", () => {
    render(<GuideDebug store={store} />);
    expect(panel().getAttribute("aria-hidden")).toBe("true");
    expect(panel().style.pointerEvents).toBe("none");
  });

  it("shows store values", () => {
    render(<GuideDebug store={store} />);
    const text = panel().textContent ?? "";
    expect(text).toContain("projects");
    expect(text).toContain("done");
    expect(text).toContain("compact");
    expect(text).toMatch(/reduced motion\s*:?\s*yes/i);
    act(() => store.set({ section: "about" }));
    expect(panel().textContent).toContain("about");
  });

  it("shows rounded per-frame values and refreshes them after the throttle interval", () => {
    render(<GuideDebug store={store} />);
    act(() => void vi.advanceTimersByTime(150));
    let text = panel().textContent ?? "";
    expect(text).toContain("wave");
    expect(text).toContain("hero");
    expect(text).toContain("10");
    expect(text).toContain("21");
    expect(text).toContain("300");
    Object.assign(debugInfo, { clip: "walk", stopId: "contact" });
    act(() => void vi.advanceTimersByTime(150));
    text = panel().textContent ?? "";
    expect(text).toContain("walk");
    expect(text).toContain("contact");
  });

  it("stops its timer on unmount", () => {
    const { unmount } = render(<GuideDebug store={store} />);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
