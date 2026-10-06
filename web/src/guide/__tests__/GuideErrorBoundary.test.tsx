// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuideErrorBoundary } from "../GuideErrorBoundary";
import { createGuideStore, INITIAL_STATE } from "../store";

beforeEach(() => {
  delete document.documentElement.dataset.guide;
  localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Boom(): never {
  throw new Error("GLB 404");
}

describe("GuideErrorBoundary", () => {
  it("removes a crashed guide, finishes the intro and frees the rail", () => {
    const store = createGuideStore({ ...INITIAL_STATE, intro: "hello" });
    render(
      <GuideErrorBoundary store={store}>
        <Boom />
      </GuideErrorBoundary>,
    );
    expect(store.getState()).toMatchObject({ enabled: false, available: false, intro: "done" });
    expect(document.documentElement.dataset.guide).toBe("off");
    expect(localStorage.getItem("guide:enabled")).toBeNull();
  });

  it("renders its children when nothing fails", () => {
    render(
      <GuideErrorBoundary store={createGuideStore()}>
        <p>fine</p>
      </GuideErrorBoundary>,
    );
    expect(screen.getByText("fine")).toBeTruthy();
  });
});
