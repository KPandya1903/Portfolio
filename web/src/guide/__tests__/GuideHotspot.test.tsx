// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GuideHotspot, MENU_ID } from "../GuideHotspot";
import { restingBox } from "../anchors";
import { createGuideStore, INITIAL_STATE, type GuideStore } from "../store";

let store: GuideStore;
beforeEach(() => {
  store = createGuideStore({ ...INITIAL_STATE, intro: "done", modelReady: true });
});
afterEach(cleanup);

const button = () => screen.queryByRole("button", { name: "Open guide menu" });

describe("GuideHotspot", () => {
  it("is a labelled, focusable button over the resting robot", () => {
    render(<GuideHotspot store={store} />);
    const b = button()!;
    expect(b.getAttribute("type")).toBe("button");
    expect(b.getAttribute("aria-expanded")).toBe("false");
    expect(b.getAttribute("aria-controls")).toBe(MENU_ID);
    expect(b.tabIndex).toBe(0);
    const { left, bottom, size } = restingBox("wide");
    expect(b.style.left).toBe(`${left}px`);
    expect(b.style.bottom).toBe(`${bottom}px`);
    expect(b.style.width).toBe(`${size}px`);
    expect(b.style.height).toBe(`${size}px`);
    expect(b.style.position).toBe("fixed");
    expect(Number(b.style.zIndex)).toBeGreaterThanOrEqual(42);
    expect(Number(b.style.zIndex)).toBeLessThan(45);
  });

  it("uses the compact box on small screens", () => {
    store.set({ mode: "compact" });
    render(<GuideHotspot store={store} />);
    expect(button()!.style.width).toBe(`${restingBox("compact").size}px`);
  });

  it("toggles the menu and mirrors it in aria-expanded", () => {
    render(<GuideHotspot store={store} />);
    fireEvent.click(button()!);
    expect(store.getState().menuOpen).toBe(true);
    expect(button()!.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(button()!);
    expect(store.getState().menuOpen).toBe(false);
  });

  it("plays the wave reaction on click, except under reduced motion (the menu still opens)", () => {
    render(<GuideHotspot store={store} />);
    fireEvent.click(button()!);
    expect(store.getState().reaction?.clip).toBe("Wave");
    cleanup();
    const reduced = createGuideStore({ ...INITIAL_STATE, intro: "done", modelReady: true, reducedMotion: true });
    render(<GuideHotspot store={reduced} />);
    fireEvent.click(button()!);
    expect(reduced.getState().reaction).toBeNull();
    expect(reduced.getState().menuOpen).toBe(true);
  });

  it.each([
    ["intro pending", { intro: "pending" as const }],
    ["intro hello", { intro: "hello" as const }],
    ["intro leaving", { intro: "leaving" as const }],
    ["a stage running", { stage: { sectionId: "skills" } }],
    ["guide off", { enabled: false }],
    ["guide unavailable", { available: false }],
  ])("is not rendered during %s", (_name, partial) => {
    store.set(partial);
    render(<GuideHotspot store={store} />);
    expect(button()).toBeNull();
  });

  it("disappears when a stage starts", () => {
    render(<GuideHotspot store={store} />);
    expect(button()).not.toBeNull();
    act(() => store.set({ stage: { sectionId: "skills" } }));
    expect(button()).toBeNull();
  });
});
