// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bubbleAnchor } from "../bubbleAnchor";
import { SpeechBubble } from "../SpeechBubble";
import { createGuideStore, INITIAL_STATE, type GuideStore } from "../store";

let store: GuideStore;
beforeEach(() => {
  vi.useFakeTimers();
  store = createGuideStore({ ...INITIAL_STATE, reducedMotion: true }); // reduced motion: no typewriter delay
  Object.assign(bubbleAnchor, { x: 140, top: 300, visible: true }); // as if the avatar has been placed
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const bubble = () => screen.queryByRole("status");
/** Say a line, then let one animation frame place the bubble (it stays hidden until placed). */
const say = (text: string) => {
  act(() => store.say(text));
  act(() => void vi.advanceTimersByTime(16));
};

describe("SpeechBubble", () => {
  it("renders nothing until the guide says something", () => {
    render(<SpeechBubble store={store} />);
    expect(bubble()).toBeNull();
  });

  it("shows the line as a polite live region", () => {
    render(<SpeechBubble store={store} />);
    say("My toolbox.");
    expect(bubble()?.textContent).toContain("My toolbox.");
    expect(bubble()?.getAttribute("aria-live")).toBe("polite");
  });

  it("types the line out when motion is allowed, and a click finishes it", () => {
    store.set({ reducedMotion: false });
    render(<SpeechBubble store={store} />);
    say("My toolbox.");
    expect(bubble()?.textContent).not.toContain("My toolbox.");
    fireEvent.click(bubble()!);
    expect(bubble()?.textContent).toContain("My toolbox.");
  });

  it("closes from its close button", () => {
    render(<SpeechBubble store={store} />);
    say("Hi");
    fireEvent.click(screen.getByRole("button", { name: "Hide guide message" }));
    expect(store.getState().bubble).toBeNull();
  });

  it("hides itself after 5 s on small screens", () => {
    store.set({ mode: "compact" });
    render(<SpeechBubble store={store} />);
    say("Hi");
    act(() => void vi.advanceTimersByTime(5000));
    expect(store.getState().bubble).toBeNull();
  });

  it("stays up on wide screens", () => {
    render(<SpeechBubble store={store} />);
    say("Hi");
    act(() => void vi.advanceTimersByTime(5000));
    expect(store.getState().bubble).not.toBeNull();
  });
});

describe("SpeechBubble placement", () => {
  it("stays hidden until the avatar has given it a position", () => {
    bubbleAnchor.visible = false;
    render(<SpeechBubble store={store} />);
    say("Hi");
    expect(bubble()).toBeNull();
    expect(screen.getByTestId("guide-bubble").style.visibility).toBe("hidden");
  });
});

describe("SpeechBubble in and out", () => {
  const inner = () => screen.getByTestId("guide-bubble").firstElementChild as HTMLElement;

  it("animates its content in with the enter class", () => {
    store.set({ reducedMotion: false });
    render(<SpeechBubble store={store} />);
    say("Hi");
    expect(inner().className).toContain("guide-bubble-in");
  });

  it("animates the whole visual box, not just the text", () => {
    store.set({ reducedMotion: false });
    render(<SpeechBubble store={store} />);
    say("Hi");
    expect(inner().className).toContain("bg-surface-light");
    expect(inner().className).toContain("border");
    expect(screen.getByTestId("guide-bubble").className).not.toContain("bg-surface-light");
  });

  it("stays up as leaving for 120 ms after the line is cleared, then unmounts", () => {
    store.set({ reducedMotion: false });
    render(<SpeechBubble store={store} />);
    say("Hi");
    act(() => store.set({ bubble: null }));
    expect(bubble()).not.toBeNull();
    expect(screen.getByTestId("guide-bubble").getAttribute("data-state")).toBe("leaving");
    expect(inner().className).toContain("guide-bubble-out");
    act(() => void vi.advanceTimersByTime(120));
    expect(bubble()).toBeNull();
  });

  it("freezes the typewriter while leaving", () => {
    store.set({ reducedMotion: false });
    render(<SpeechBubble store={store} />);
    act(() => store.say("A rather long line to type."));
    act(() => void vi.advanceTimersByTime(200));
    act(() => store.set({ bubble: null }));
    const frozen = bubble()?.textContent;
    expect(frozen).toBeTruthy();
    act(() => void vi.advanceTimersByTime(100));
    expect(bubble()?.textContent).toBe(frozen);
  });

  it("does not take input while leaving", () => {
    store.set({ reducedMotion: false });
    render(<SpeechBubble store={store} />);
    say("Hi");
    expect(inner().hasAttribute("inert")).toBe(false);
    act(() => store.set({ bubble: null }));
    expect(inner().hasAttribute("inert")).toBe(true);
  });

  it("fires its compact auto-hide only once while leaving", () => {
    store.set({ mode: "compact", reducedMotion: false });
    render(<SpeechBubble store={store} />);
    say("Hi");
    act(() => void vi.advanceTimersByTime(5000));
    expect(bubble()).not.toBeNull();
    const spy = vi.spyOn(store, "set");
    act(() => void vi.advanceTimersByTime(5000));
    expect(spy).not.toHaveBeenCalled();
    expect(bubble()).toBeNull();
  });

  it("shows a new line at once during the leave window, with no leaving state", () => {
    store.set({ reducedMotion: false });
    render(<SpeechBubble store={store} />);
    say("Hi");
    const before = inner();
    act(() => store.set({ bubble: null }));
    act(() => store.say("Again"));
    expect(inner()).not.toBe(before);
    expect(screen.getByTestId("guide-bubble").getAttribute("data-state")).toBeNull();
    expect(inner().className).toContain("guide-bubble-in");
  });

  it("disappears at once under reduced motion, with no animation class", () => {
    store.set({ reducedMotion: true }); // explicit: beforeEach already sets it
    render(<SpeechBubble store={store} />);
    say("Hi");
    expect(inner().className).not.toContain("guide-bubble-in");
    act(() => store.set({ bubble: null }));
    expect(bubble()).toBeNull();
  });
});
