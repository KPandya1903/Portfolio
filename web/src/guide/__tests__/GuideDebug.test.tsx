// @vitest-environment happy-dom
import { act, cleanup, render, screen } from "@testing-library/react";
import { Profiler } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debugInfo } from "../debugInfo";
import { GuideDebug } from "../GuideDebug";
import { createGuideStore, INITIAL_STATE, type GuideStore } from "../store";

let store: GuideStore;
beforeEach(() => {
  vi.useFakeTimers();
  store = createGuideStore({ ...INITIAL_STATE, section: "projects", intro: "done", mode: "compact", reducedMotion: true });
  Object.assign(debugInfo, { clip: "wave", anchorX: 10.4, anchorY: 20.6, heightPx: 300.2, x: 0, y: 0, curHeightPx: 0, stopId: "hero" });
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

  it("shows the hovered item", () => {
    render(<GuideDebug store={store} />);
    expect(panel().textContent).toContain("hover: -");
    act(() => store.set({ hover: { id: "project-nexusmesh" } }));
    expect(panel().textContent).toContain("hover: project-nexusmesh");
  });

  it("shows rounded per-frame values and refreshes them only after the throttle interval", () => {
    Object.assign(debugInfo, { x: 33.4, y: 44.5, curHeightPx: 250.7 });
    render(<GuideDebug store={store} />);
    act(() => void vi.advanceTimersByTime(100));
    let text = panel().textContent ?? "";
    expect(text).toContain("clip: wave");
    expect(text).toContain("stop: hero");
    expect(text).toContain("target x: 10");
    expect(text).toContain("target y: 21");
    expect(text).toContain("target height: 300");
    expect(text).toContain("x: 33");
    expect(text).toContain("y: 45");
    expect(text).toContain("height: 251");
    expect(text).not.toContain("10.4");
    Object.assign(debugInfo, { clip: "walk", stopId: "contact", anchorX: 99.2 });
    act(() => void vi.advanceTimersByTime(50));
    expect(panel().textContent).toContain("clip: wave");
    act(() => void vi.advanceTimersByTime(60));
    text = panel().textContent ?? "";
    expect(text).toContain("clip: walk");
    expect(text).toContain("stop: contact");
    expect(text).toContain("target x: 99");
  });

  it("keeps the same state when the displayed values are unchanged", () => {
    let commits = 0;
    render(
      <Profiler id="dbg" onRender={() => void commits++}>
        <GuideDebug store={store} />
      </Profiler>,
    );
    act(() => void vi.advanceTimersByTime(100));
    const baseline = commits;
    const before = panel().textContent;
    debugInfo.anchorX = 10.2; // rounds to the same 10
    act(() => void vi.advanceTimersByTime(300));
    expect(panel().textContent).toBe(before);
    expect(commits).toBe(baseline);
  });

  it("stops its timer on unmount", () => {
    const { unmount } = render(<GuideDebug store={store} />);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
