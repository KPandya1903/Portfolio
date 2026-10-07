// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHIPS } from "../config";
import { GuideChips } from "../GuideChips";
import { GuideHotspot } from "../GuideHotspot";
import { createGuideStore, INITIAL_STATE, type GuideStore } from "../store";

let store: GuideStore;
beforeEach(() => {
  vi.useFakeTimers();
  store = createGuideStore({ ...INITIAL_STATE, intro: "done", modelReady: true });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

const menu = () => document.querySelector('nav[aria-label="Guide menu"]') as HTMLElement | null;
const chipButtons = () => screen.queryAllByRole("button").filter((b) => menu()?.contains(b));
const open = () => act(() => store.toggleMenu());
const setup = () =>
  render(
    <>
      <GuideHotspot store={store} />
      <GuideChips store={store} />
    </>,
  );

describe("GuideChips", () => {
  it("is hidden and inert while closed, so the chips are out of the tab order", () => {
    setup();
    expect(menu()!.hasAttribute("hidden")).toBe(true);
    expect(menu()!.hasAttribute("inert")).toBe(true);
    expect(chipButtons()).toHaveLength(0); // hidden content is not exposed
  });

  it("shows one plain button per configured chip when open", () => {
    setup();
    open();
    expect(menu()!.hasAttribute("hidden")).toBe(false);
    expect(menu()!.hasAttribute("inert")).toBe(false);
    expect(menu()!.id).toBe("guide-menu");
    expect(chipButtons().map((b) => b.textContent)).toEqual(CHIPS.map((c) => c.label));
    for (const b of chipButtons()) expect(b.getAttribute("type")).toBe("button");
  });

  it("stays mounted 120 ms while leaving (inert), then hides; reduced motion hides at once", () => {
    setup();
    open();
    act(() => store.closeMenu());
    expect(menu()!.hasAttribute("hidden")).toBe(false);
    expect(menu()!.hasAttribute("inert")).toBe(true);
    act(() => void vi.advanceTimersByTime(121));
    expect(menu()!.hasAttribute("hidden")).toBe(true);

    open();
    act(() => store.set({ reducedMotion: true }));
    act(() => store.closeMenu());
    expect(menu()!.hasAttribute("hidden")).toBe(true);
  });

  it("closes on Escape and returns focus to the hotspot", () => {
    setup();
    open();
    chipButtons()[0].focus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(store.getState().menuOpen).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Open guide menu" }));
  });

  it("ignores Escape while closed", () => {
    setup();
    const spy = vi.spyOn(store, "closeMenu");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("closes on a press outside, but not inside the menu or on the hotspot", () => {
    setup();
    open();
    fireEvent.pointerDown(chipButtons()[1]);
    expect(store.getState().menuOpen).toBe(true);
    fireEvent.pointerDown(screen.getByRole("button", { name: "Open guide menu" }));
    expect(store.getState().menuOpen).toBe(true);
    fireEvent.pointerDown(document.body);
    expect(store.getState().menuOpen).toBe(false);
  });

  it("the Resume chip opens the PDF in a new tab, without opener, and closes the menu", () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    setup();
    open();
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    expect(openSpy).toHaveBeenCalledWith("/Kunj_Pandya_Resume.pdf", "_blank", "noopener");
    expect(store.getState().menuOpen).toBe(false);
  });

  it("a section chip closes the menu, requests a forced stage and scrolls smoothly", () => {
    const target = document.createElement("section");
    target.id = "skills";
    const scroll = vi.fn();
    target.scrollIntoView = scroll;
    document.body.appendChild(target);
    setup();
    open();
    fireEvent.click(screen.getByRole("button", { name: "Skills" }));
    expect(store.getState().menuOpen).toBe(false);
    expect(store.getState().forcedStage).toBe("skills");
    expect(scroll).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  it("on compact screens a chip only scrolls (no stage request)", () => {
    const target = document.createElement("section");
    target.id = "projects";
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);
    store.set({ mode: "compact" });
    setup();
    open();
    fireEvent.click(screen.getByRole("button", { name: "Projects" }));
    expect(target.scrollIntoView).toHaveBeenCalled();
    expect(store.getState().forcedStage).toBeNull();
  });

  it("scrolls instantly under reduced motion", () => {
    const target = document.createElement("section");
    target.id = "contact";
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);
    store.set({ reducedMotion: true });
    setup();
    open();
    fireEvent.click(screen.getByRole("button", { name: "Contact" }));
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto" });
  });

  it("renders nothing while the hotspot is not allowed (intro, stage)", () => {
    store.set({ intro: "hello" });
    setup();
    expect(menu()).toBeNull();
  });
});
