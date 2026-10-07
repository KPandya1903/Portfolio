// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GUIDE_STOPS, HOVER_COOLDOWN_MS, HOVER_DWELL_MS, HOVER_LEAVE_MS, HOVER_LINES, STAGE_MIN_DWELL_MS } from "../config";
import { hoverGaze } from "../hoverGaze";
import { createGuideStore, type GuideStore } from "../store";
import { useHoverReaction } from "../useHoverReaction";
import { useStage } from "../useStage";

const A = "project-nexusmesh";
const B = "project-taskpulse";
const rects: Record<string, { left: number; top: number; width: number; height: number }> = {};

function card(id: string, rect = { left: 100, top: 200, width: 60, height: 40 }) {
  const el = document.createElement("div");
  el.dataset.guideHover = id;
  const child = document.createElement("span");
  el.appendChild(child);
  document.body.appendChild(el);
  rects[id] = rect;
  el.getBoundingClientRect = () => rects[id] as DOMRect;
  return { el, child };
}
function fire(type: "pointerover" | "pointerout", target: Element, extra: { pointerType?: string; relatedTarget?: Element | null } = {}) {
  const e = new Event(type, { bubbles: true });
  Object.assign(e, { pointerType: "mouse", relatedTarget: null, ...extra });
  act(() => void target.dispatchEvent(e));
}
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

let store: GuideStore;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(100_000);
  store = createGuideStore();
  // No section (nothing about to stage) and a section that has been active for a while, so only the rule under test applies.
  store.set({ intro: "done", modelReady: true });
  vi.advanceTimersByTime(1000);
});
afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.useRealTimers();
});

const start = () => renderHook(() => useHoverReaction(store));
const hover = () => store.getState().hover;
const bubbleText = () => store.getState().bubble?.text ?? null;

describe("useHoverReaction", () => {
  it("looks and speaks only after the dwell", () => {
    start();
    const { el } = card(A);
    fire("pointerover", el);
    tick(HOVER_DWELL_MS - 1);
    expect(hover()).toBeNull();
    expect(bubbleText()).toBeNull();
    tick(1);
    expect(hover()).toEqual({ id: A });
    expect(bubbleText()).toBe(HOVER_LINES[A]);
    expect(store.getState().bubble?.kind).toBe("hover");
  });

  it("measures the hovered element's centre on dwell-complete", () => {
    start();
    const { el } = card(A, { left: 100, top: 200, width: 60, height: 40 });
    fire("pointerover", el);
    tick(HOVER_DWELL_MS);
    expect(hoverGaze.center.current).toEqual({ x: 130, y: 220 });
  });

  it("re-measures on scroll while hovered", () => {
    start();
    const { el } = card(A);
    fire("pointerover", el);
    tick(HOVER_DWELL_MS);
    rects[A] = { left: 100, top: 500, width: 60, height: 40 };
    act(() => void window.dispatchEvent(new Event("scroll")));
    tick(100);
    expect(hoverGaze.center.current).toEqual({ x: 130, y: 520 });
  });

  it("delegates from a child of the marked element", () => {
    start();
    const { child } = card(A);
    fire("pointerover", child);
    tick(HOVER_DWELL_MS);
    expect(hover()).toEqual({ id: A });
  });

  it("ignores elements that are not marked", () => {
    start();
    const el = document.createElement("div");
    document.body.appendChild(el);
    fire("pointerover", el);
    tick(5000);
    expect(hover()).toBeNull();
  });

  it("does not leave when the pointer moves between children of the same card", () => {
    start();
    const { el, child } = card(A);
    fire("pointerover", el);
    tick(HOVER_DWELL_MS);
    fire("pointerout", el, { relatedTarget: child });
    tick(HOVER_LEAVE_MS + 100);
    expect(hover()).toEqual({ id: A });
  });

  it("stops looking HOVER_LEAVE_MS after the pointer leaves", () => {
    start();
    const { el } = card(A);
    fire("pointerover", el);
    tick(HOVER_DWELL_MS);
    fire("pointerout", el);
    tick(HOVER_LEAVE_MS - 1);
    expect(hover()).toEqual({ id: A });
    tick(1);
    expect(hover()).toBeNull();
    expect(hoverGaze.center.current).toBeNull();
  });

  it("does nothing when the pointer leaves before the dwell completes", () => {
    start();
    const { el } = card(A);
    fire("pointerover", el);
    tick(HOVER_DWELL_MS - 50);
    fire("pointerout", el);
    tick(5000);
    expect(hover()).toBeNull();
    expect(bubbleText()).toBeNull();
  });

  it("moving to another card cancels the leave timer and restarts the dwell", () => {
    start();
    const a = card(A);
    const b = card(B, { left: 400, top: 200, width: 60, height: 40 });
    fire("pointerover", a.el);
    tick(HOVER_DWELL_MS);
    fire("pointerout", a.el, { relatedTarget: b.el });
    fire("pointerover", b.el, { relatedTarget: a.el });
    tick(HOVER_DWELL_MS - 1);
    expect(hover()).toEqual({ id: A }); // still looking at A until B's dwell completes
    tick(1);
    expect(hover()).toEqual({ id: B });
    tick(HOVER_LEAVE_MS * 2);
    expect(hover()).toEqual({ id: B }); // A's leave timer must not clear B
  });

  it("limits lines with the cooldown but still looks", () => {
    start();
    const a = card(A);
    const b = card(B);
    fire("pointerover", a.el);
    tick(HOVER_DWELL_MS);
    const key = store.getState().bubble!.key;
    fire("pointerout", a.el, { relatedTarget: b.el });
    fire("pointerover", b.el);
    tick(HOVER_DWELL_MS);
    expect(hover()).toEqual({ id: B });
    expect(store.getState().bubble!.key).toBe(key);
    expect(bubbleText()).toBe(HOVER_LINES[A]);
    fire("pointerout", b.el);
    tick(HOVER_COOLDOWN_MS);
    fire("pointerover", b.el);
    tick(HOVER_DWELL_MS);
    expect(bubbleText()).toBe(HOVER_LINES[B]);
  });

  it("looks silently at an item with no line", () => {
    start();
    const { el } = card("journey-acm");
    fire("pointerover", el);
    tick(HOVER_DWELL_MS);
    expect(hover()).toEqual({ id: "journey-acm" });
    expect(bubbleText()).toBeNull();
  });

  it("ignores touch and pen pointers", () => {
    start();
    const { el } = card(A);
    fire("pointerover", el, { pointerType: "touch" });
    fire("pointerover", el, { pointerType: "pen" });
    tick(5000);
    expect(hover()).toBeNull();
  });

  it.each([
    ["the intro is not done", { intro: "hello" as const }],
    ["compact mode", { mode: "compact" as const }],
    ["reduced motion", { reducedMotion: true }],
    ["a stage is running", { stage: { sectionId: "projects" } }],
  ])("does nothing while %s", (_n, patch) => {
    store.set(patch);
    start();
    const { el } = card(A);
    fire("pointerover", el);
    tick(5000);
    expect(hover()).toBeNull();
    expect(bubbleText()).toBeNull();
  });

  it("drops the hover when a section change happens, and a later dwell does nothing stale", () => {
    start();
    const { el } = card(A);
    fire("pointerover", el);
    tick(HOVER_DWELL_MS);
    expect(hover()).toEqual({ id: A });
    act(() => store.setSection("skills"));
    expect(hover()).toBeNull();
    expect(hoverGaze.center.current).toBeNull();
    tick(5000);
    expect(hover()).toBeNull();
  });

  it("cancels a pending dwell when the section changes", () => {
    start();
    const { el } = card(A);
    fire("pointerover", el);
    tick(HOVER_DWELL_MS - 100);
    act(() => store.setSection("skills"));
    tick(1000);
    expect(hover()).toBeNull();
    expect(bubbleText()).toBeNull();
  });

  it("drops the hover when a stage starts", () => {
    start();
    const { el } = card(A);
    fire("pointerover", el);
    tick(HOVER_DWELL_MS);
    act(() => store.startStage("experience"));
    expect(hover()).toBeNull();
    expect(hoverGaze.center.current).toBeNull();
  });

  it.each([
    ["compact mode", { mode: "compact" as const }],
    ["reduced motion", { reducedMotion: true }],
  ])("drops the look when %s switches on mid-hover", (_n, patch) => {
    start();
    const { el } = card(A);
    fire("pointerover", el);
    tick(HOVER_DWELL_MS);
    expect(hover()).toEqual({ id: A });
    act(() => store.set(patch));
    expect(hover()).toBeNull();
    expect(hoverGaze.center.current).toBeNull();
  });

  it("refuses hover while the section is about to stage, and the stage line is what gets said", () => {
    renderHook(() => (useStage(store), useHoverReaction(store)));
    const { el } = card(A);
    act(() => store.setSection("experience"));
    fire("pointerover", el);
    tick(HOVER_DWELL_MS + 100); // the dwell completes before the stage starts
    expect(hover()).toBeNull();
    expect(bubbleText()).toBeNull();
    tick(STAGE_MIN_DWELL_MS);
    expect(store.getState().stage?.sectionId).toBe("experience");
    expect(bubbleText()).toBe(GUIDE_STOPS.find((s) => s.id === "experience")!.line);
    expect(hover()).toBeNull();
  });

  it("does not let a hover line replace the corner line of a section that will not stage", () => {
    (store.staged as Set<string>).add("about"); // already staged this page view: its line comes from the corner instead
    renderHook(() => (useStage(store), useHoverReaction(store)));
    const { el } = card(A);
    act(() => store.setSection("about"));
    fire("pointerover", el);
    tick(HOVER_DWELL_MS + 100);
    expect(bubbleText()).toBeNull();
    tick(STAGE_MIN_DWELL_MS);
    expect(bubbleText()).toBe(GUIDE_STOPS.find((s) => s.id === "about")!.line);
  });

  it("clears timers, listeners and the hover on unmount", () => {
    const { unmount } = start();
    const { el } = card(A);
    fire("pointerover", el);
    tick(HOVER_DWELL_MS);
    fire("pointerout", el);
    unmount();
    expect(hover()).toBeNull();
    tick(5000);
    expect(hover()).toBeNull();
    fire("pointerover", el);
    tick(5000);
    expect(hover()).toBeNull();
    expect(hoverGaze.center.current).toBeNull();
  });

  it("does not fire a pending dwell after unmount", () => {
    const { unmount } = start();
    const { el } = card(A);
    fire("pointerover", el);
    tick(HOVER_DWELL_MS - 10);
    unmount();
    tick(1000);
    expect(hover()).toBeNull();
    expect(bubbleText()).toBeNull();
  });
});
