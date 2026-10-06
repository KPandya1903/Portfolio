import { describe, expect, it } from "vitest";
import { shouldShowDebug } from "../shouldShowDebug";

describe("shouldShowDebug", () => {
  it("is on in development with ?guideDebug=1", () => {
    expect(shouldShowDebug("development", "?guideDebug=1")).toBe(true);
    expect(shouldShowDebug("test", "?a=b&guideDebug=1")).toBe(true);
    expect(shouldShowDebug(undefined, "?guideDebug=1")).toBe(true);
  });
  it("is off in production even with the param", () => {
    expect(shouldShowDebug("production", "?guideDebug=1")).toBe(false);
  });
  it("is off without the param or with another value", () => {
    expect(shouldShowDebug("development", "")).toBe(false);
    expect(shouldShowDebug("development", "?guideDebug=0")).toBe(false);
    expect(shouldShowDebug("development", "?guideDebug")).toBe(false);
  });
});
