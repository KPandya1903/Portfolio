// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePresence } from "../usePresence";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const setup = (initial: string | null, exitMs = 120) =>
  renderHook(({ v }: { v: string | null }) => usePresence(v, exitMs), { initialProps: { v: initial } });

describe("usePresence", () => {
  it("returns a non-null value immediately", () => {
    const { result } = setup("a");
    expect(result.current).toEqual({ shown: "a", leaving: false });
  });

  it("holds the previous value as leaving until exitMs, then drops it", () => {
    const { result, rerender } = setup("a");
    rerender({ v: null });
    expect(result.current).toEqual({ shown: "a", leaving: true });
    act(() => void vi.advanceTimersByTime(119));
    expect(result.current).toEqual({ shown: "a", leaving: true });
    act(() => void vi.advanceTimersByTime(1));
    expect(result.current).toEqual({ shown: null, leaving: false });
  });

  it("drops immediately when exitMs is 0", () => {
    const { result, rerender } = setup("a", 0);
    rerender({ v: null });
    expect(result.current).toEqual({ shown: null, leaving: false });
  });

  it("shows a new value at once during the leave window", () => {
    const { result, rerender } = setup("a");
    rerender({ v: null });
    act(() => void vi.advanceTimersByTime(50));
    rerender({ v: "b" });
    expect(result.current).toEqual({ shown: "b", leaving: false });
    act(() => void vi.advanceTimersByTime(500));
    expect(result.current).toEqual({ shown: "b", leaving: false });
  });

  it("is null and not leaving when it never had a value", () => {
    const { result } = setup(null);
    expect(result.current).toEqual({ shown: null, leaving: false });
  });

  it("clears its timer on unmount", () => {
    const { rerender, unmount } = setup("a");
    rerender({ v: null });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
