// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flashHighlight } from "../highlight";

describe("flashHighlight", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '<h2 id="target">Skills</h2>';
  });
  afterEach(() => vi.useRealTimers());

  const target = () => document.getElementById("target")!;

  it("adds the ring class to the element", () => {
    flashHighlight("#target");
    expect(target().classList.contains("guide-highlight")).toBe(true);
  });

  it("removes the ring after 1.6 s", () => {
    flashHighlight("#target");
    vi.advanceTimersByTime(1599);
    expect(target().classList.contains("guide-highlight")).toBe(true);
    vi.advanceTimersByTime(1);
    expect(target().classList.contains("guide-highlight")).toBe(false);
  });

  it("restarts the 1.6 s window when flashed again", () => {
    flashHighlight("#target");
    vi.advanceTimersByTime(1000);
    flashHighlight("#target");
    vi.advanceTimersByTime(1000);
    expect(target().classList.contains("guide-highlight")).toBe(true);
    vi.advanceTimersByTime(600);
    expect(target().classList.contains("guide-highlight")).toBe(false);
  });

  it("does nothing when the selector matches nothing", () => {
    expect(() => flashHighlight("#missing")).not.toThrow();
  });
});
