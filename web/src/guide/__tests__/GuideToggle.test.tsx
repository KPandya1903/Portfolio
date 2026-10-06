// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GUIDE_ENABLED_KEY } from "../environment";
import { GuideToggle } from "../GuideToggle";
import { createGuideStore, type GuideStore } from "../store";

let store: GuideStore;
beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.guide;
  store = createGuideStore();
});
afterEach(cleanup);

const button = () => screen.getByRole("button");

describe("GuideToggle", () => {
  it("shows the guide as on and pressed by default", () => {
    render(<GuideToggle store={store} />);
    expect(button().textContent).toBe("Guide on");
    expect(button().getAttribute("aria-pressed")).toBe("true");
  });

  it("turns the guide off, remembers it, and drops the rail", () => {
    render(<GuideToggle store={store} />);
    fireEvent.click(button());
    expect(store.getState().enabled).toBe(false);
    expect(localStorage.getItem(GUIDE_ENABLED_KEY)).toBe("0");
    expect(document.documentElement.dataset.guide).toBe("off");
    expect(button().textContent).toBe("Guide off");
  });

  it("turns it back on", () => {
    render(<GuideToggle store={store} />);
    fireEvent.click(button());
    fireEvent.click(button());
    expect(store.getState().enabled).toBe(true);
    expect(localStorage.getItem(GUIDE_ENABLED_KEY)).toBe("1");
    expect(document.documentElement.dataset.guide).toBeUndefined();
  });
});
