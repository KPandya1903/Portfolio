// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTargetCenter } from "../useTargetCenter";

function fakeEl(rect: { left: number; top: number; width: number; height: number }) {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const getBoundingClientRect = vi.fn(() => rect as DOMRect);
  el.getBoundingClientRect = getBoundingClientRect;
  return { el, getBoundingClientRect };
}

const frame = () => act(() => void vi.advanceTimersByTime(20));

describe("useTargetCenter", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

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

  it("re-measures when an inner element scrolls (scroll does not bubble, so the listener captures)", () => {
    const { result } = renderHook(() => useTargetCenter());
    const rect = { left: 0, top: 0, width: 10, height: 10 };
    const { el, getBoundingClientRect } = fakeEl(rect);
    act(() => result.current.track(el));
    rect.left = 50;
    const strip = document.createElement("div");
    document.body.appendChild(strip);
    act(() => void strip.dispatchEvent(new Event("scroll"))); // non-bubbling, like a real element scroll
    frame();
    expect(getBoundingClientRect).toHaveBeenCalledTimes(2);
    expect(result.current.center.current).toEqual({ x: 55, y: 5 });
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

  it("schedules no frame on scroll when nothing is tracked", () => {
    const raf = vi.spyOn(window, "requestAnimationFrame");
    renderHook(() => useTargetCenter());
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
    expect(raf).not.toHaveBeenCalled();
    raf.mockRestore();
  });

  it("treats a disconnected element as no target", () => {
    const { result } = renderHook(() => useTargetCenter());
    const el = document.createElement("div");
    document.body.appendChild(el);
    el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 10, height: 10 }) as DOMRect;
    act(() => result.current.track(el));
    expect(result.current.center.current).toEqual({ x: 5, y: 5 });
    el.remove();
    act(() => result.current.refresh());
    expect(result.current.center.current).toBeNull();
  });

  it("refresh re-measures immediately", () => {
    const { result } = renderHook(() => useTargetCenter());
    const rect = { left: 0, top: 0, width: 10, height: 10 };
    const { el } = fakeEl(rect);
    act(() => result.current.track(el));
    rect.left = 50;
    act(() => result.current.refresh());
    expect(result.current.center.current).toEqual({ x: 55, y: 5 });
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
