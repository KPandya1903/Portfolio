// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGuideStore } from "../store";
import { useActiveSection } from "../useActiveSection";

/** IntersectionObserver fake: records options and targets, lets the test fire entries. */
class FakeObserver {
  static last: FakeObserver | undefined;
  targets: Element[] = [];
  disconnected = false;
  constructor(
    public callback: (entries: Partial<IntersectionObserverEntry>[]) => void,
    public options: IntersectionObserverInit,
  ) {
    FakeObserver.last = this;
  }
  observe(el: Element) {
    this.targets.push(el);
  }
  disconnect() {
    this.disconnected = true;
  }
  fire(id: string, isIntersecting: boolean) {
    this.callback([{ target: document.getElementById(id)!, isIntersecting }]);
  }
}

beforeEach(() => {
  FakeObserver.last = undefined;
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  document.body.innerHTML = '<section id="hero"></section><section id="skills"></section>';
});
afterEach(() => vi.unstubAllGlobals());

/** The observer the hook created in this test; fails (not errors) if it created none. */
function observer(): FakeObserver {
  expect(FakeObserver.last, "no IntersectionObserver was created").toBeDefined();
  return FakeObserver.last!;
}

const IDS = ["hero", "linkedin", "skills"] as const;

describe("useActiveSection", () => {
  it("observes only the sections that exist", () => {
    renderHook(() => useActiveSection(IDS, createGuideStore()));
    expect(observer().targets.map((t) => t.id)).toEqual(["hero", "skills"]);
  });

  it("watches a 10% band through the middle of the viewport", () => {
    renderHook(() => useActiveSection(IDS, createGuideStore()));
    expect(observer().options.rootMargin).toBe("-45% 0px -45% 0px");
  });

  it("makes the section entering the band active", () => {
    const store = createGuideStore();
    renderHook(() => useActiveSection(IDS, store));
    act(() => observer().fire("skills", true));
    expect(store.getState().section).toBe("skills");
  });

  it("ignores a section leaving the band", () => {
    const store = createGuideStore();
    renderHook(() => useActiveSection(IDS, store));
    act(() => observer().fire("skills", false));
    expect(store.getState().section).toBeNull();
  });

  it("disconnects on unmount", () => {
    const { unmount } = renderHook(() => useActiveSection(IDS, createGuideStore()));
    unmount();
    expect(observer().disconnected).toBe(true);
  });
});
