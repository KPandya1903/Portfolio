// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTargetCenter } from "../useTargetCenter";

function fakeEl(rect: { left: number; top: number; width: number; height: number }) {
  const getBoundingClientRect = vi.fn(() => rect as DOMRect);
  return { el: { getBoundingClientRect } as unknown as Element, getBoundingClientRect };
}

const frame = () => act(() => void vi.advanceTimersByTime(20));

describe("useTargetCenter", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("measures the element centre on track", () => {
    const { result } = renderHook(() => useTargetCenter());
    const { el } = fakeEl({ left: 100, top: 40, width: 60, height: 20 });
    act(() => result.current.track(el));
    expect(result.current.center.current).toEqual({ x: 130, y: 50 });
  });

  it("clears the centre on track(null)", () => {
    const { result } = renderHook(() => useTargetCenter());
    act(() => result.current.track(fakeEl({ left: 0, top: 0, width: 10, height: 10 }).el));
    act(() => result.current.track(null));
    expect(result.current.center.current).toBeNull();
  });

  it("re-measures once per frame after scroll events", () => {
    const { result } = renderHook(() => useTargetCenter());
    const rect = { left: 0, top: 0, width: 10, height: 10 };
    const { el, getBoundingClientRect } = fakeEl(rect);
    act(() => result.current.track(el));
    expect(getBoundingClientRect).toHaveBeenCalledTimes(1);
    rect.top = 100;
    for (let i = 0; i < 5; i++) window.dispatchEvent(new Event("scroll"));
    expect(getBoundingClientRect).toHaveBeenCalledTimes(1);
    frame();
    expect(getBoundingClientRect).toHaveBeenCalledTimes(2);
    expect(result.current.center.current).toEqual({ x: 5, y: 105 });
  });

  it("re-measures on resize", () => {
    const { result } = renderHook(() => useTargetCenter());
    const { el, getBoundingClientRect } = fakeEl({ left: 0, top: 0, width: 10, height: 10 });
    act(() => result.current.track(el));
    window.dispatchEvent(new Event("resize"));
    frame();
    expect(getBoundingClientRect).toHaveBeenCalledTimes(2);
  });

  it("does nothing when no element is tracked", () => {
    const { result } = renderHook(() => useTargetCenter());
    window.dispatchEvent(new Event("scroll"));
    frame();
    expect(result.current.center.current).toBeNull();
  });

  it("stops listening and cancels a pending frame after unmount", () => {
    const { result, unmount } = renderHook(() => useTargetCenter());
    const { el, getBoundingClientRect } = fakeEl({ left: 0, top: 0, width: 10, height: 10 });
    act(() => result.current.track(el));
    window.dispatchEvent(new Event("scroll"));
    unmount();
    frame();
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
    frame();
    expect(getBoundingClientRect).toHaveBeenCalledTimes(1);
  });
});
