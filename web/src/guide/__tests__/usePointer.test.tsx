// @vitest-environment happy-dom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POINTER_IDLE_MS } from "../config";
import { usePointer } from "../usePointer";

function move(x: number, y: number, pointerType = "mouse") {
  const e = new Event("pointermove") as Event & { clientX: number; clientY: number; pointerType: string };
  Object.assign(e, { clientX: x, clientY: y, pointerType });
  window.dispatchEvent(e);
}

describe("usePointer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("is idle until the mouse moves", () => {
    const { result } = renderHook(() => usePointer());
    expect(result.current.isActive(Date.now())).toBe(false);
  });

  it("records the mouse position and activity", () => {
    const { result } = renderHook(() => usePointer());
    move(120, 45);
    expect(result.current.pointer.current.x).toBe(120);
    expect(result.current.pointer.current.y).toBe(45);
    expect(result.current.pointer.current.lastMove).toBe(10_000);
    expect(result.current.isActive(Date.now())).toBe(true);
  });

  it("ignores touch and pen", () => {
    const { result } = renderHook(() => usePointer());
    move(1, 2, "touch");
    move(3, 4, "pen");
    expect(result.current.isActive(Date.now())).toBe(false);
    expect(result.current.pointer.current.x).toBe(0);
  });

  it("goes idle after POINTER_IDLE_MS", () => {
    const { result } = renderHook(() => usePointer());
    move(10, 10);
    vi.setSystemTime(10_000 + POINTER_IDLE_MS - 1);
    expect(result.current.isActive(Date.now())).toBe(true);
    vi.setSystemTime(10_000 + POINTER_IDLE_MS);
    expect(result.current.isActive(Date.now())).toBe(false);
  });

  it("removes the listener on unmount", () => {
    const { result, unmount } = renderHook(() => usePointer());
    unmount();
    move(50, 50);
    expect(result.current.isActive(Date.now())).toBe(false);
  });

  it("does not re-render on move", () => {
    let renders = 0;
    renderHook(() => {
      renders++;
      return usePointer();
    });
    const before = renders;
    for (let i = 0; i < 20; i++) move(i, i);
    expect(renders).toBe(before);
  });
});
