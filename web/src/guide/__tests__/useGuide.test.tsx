// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createGuideStore, useGuide } from "../store";

describe("useGuide", () => {
  it("reads from an injected store and re-renders when it changes", () => {
    const store = createGuideStore();
    const { result } = renderHook(() => useGuide((s) => s.mode, store));
    expect(result.current).toBe("wide");
    act(() => store.set({ mode: "compact" }));
    expect(result.current).toBe("compact");
  });
});
