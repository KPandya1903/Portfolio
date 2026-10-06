// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTypewriter } from "../useTypewriter";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("useTypewriter", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useTypewriter("Hello", 1, 10));
    expect(result.current.text).toBe("");
  });

  it("reveals one character per 1/cps seconds", () => {
    const { result } = renderHook(() => useTypewriter("Hello", 1, 10));
    tick(300);
    expect(result.current.text).toBe("Hel");
  });

  it("stops at the end of the line", () => {
    const { result } = renderHook(() => useTypewriter("Hi", 1, 10));
    tick(1000);
    expect(result.current.text).toBe("Hi");
  });

  it("restarts from the beginning when the key changes", () => {
    const { result, rerender } = renderHook(({ key }) => useTypewriter("Hello", key, 10), { initialProps: { key: 1 } });
    tick(300);
    rerender({ key: 2 });
    expect(result.current.text).toBe("");
    tick(100);
    expect(result.current.text).toBe("H");
  });

  it("shows the whole line at once when cps is Infinity (reduced motion)", () => {
    const { result } = renderHook(() => useTypewriter("Hello", 1, Infinity));
    expect(result.current.text).toBe("Hello");
  });

  it("finish() reveals the rest immediately", () => {
    const { result } = renderHook(() => useTypewriter("Hello", 1, 10));
    tick(100);
    act(() => result.current.finish());
    expect(result.current.text).toBe("Hello");
  });
});
