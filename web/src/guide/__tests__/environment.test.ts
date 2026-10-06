// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GUIDE_ENABLED_KEY,
  failGuide,
  hasWebGL,
  INTRO_SEEN_KEY,
  primeGuideState,
  readStorage,
  REDUCED_QUERY,
  WIDE_QUERY,
  writeStorage,
} from "../environment";
import { createGuideStore, INITIAL_STATE } from "../store";

const matching = (...queries: string[]) => (q: string) => queries.includes(q);

beforeEach(() => {
  delete document.documentElement.dataset.guide;
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => vi.restoreAllMocks());

describe("storage helpers", () => {
  it("round-trips a value", () => {
    writeStorage("local", "k", "v");
    expect(readStorage("local", "k")).toBe("v");
  });

  it("reads null instead of throwing when storage is blocked", () => {
    // Browsers that block site data throw on accessing window.sessionStorage itself.
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(readStorage("session", "k")).toBeNull();
  });

  it("swallows write errors when storage is blocked", () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(() => writeStorage("local", "k", "v")).not.toThrow();
  });
});

describe("hasWebGL", () => {
  it("is true when a webgl2 context can be created", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as RenderingContext);
    expect(hasWebGL()).toBe(true);
  });

  it("is false when the context is unavailable", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(hasWebGL()).toBe(false);
  });
});

describe("primeGuideState", () => {
  const yesWebGL = () => true;

  it("starts a first visit in wide mode with the intro pending", () => {
    // Start from the opposite of every expected value, so the test proves primeGuideState set them.
    const store = createGuideStore({ ...INITIAL_STATE, mode: "compact", enabled: false, reducedMotion: true });
    primeGuideState(store, matching(WIDE_QUERY), yesWebGL);
    expect(store.getState()).toMatchObject({ mode: "wide", enabled: true, intro: "pending", reducedMotion: false });
  });

  it("uses compact mode below the wide breakpoint", () => {
    const store = createGuideStore();
    primeGuideState(store, matching(), yesWebGL);
    expect(store.getState().mode).toBe("compact");
  });

  it("skips the intro under reduced motion", () => {
    const store = createGuideStore();
    primeGuideState(store, matching(WIDE_QUERY, REDUCED_QUERY), yesWebGL);
    expect(store.getState()).toMatchObject({ reducedMotion: true, intro: "done" });
  });

  it("skips the intro when this session has already seen it", () => {
    sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    const store = createGuideStore();
    primeGuideState(store, matching(WIDE_QUERY), yesWebGL);
    expect(store.getState().intro).toBe("done");
  });

  it("stays off when the visitor turned the guide off", () => {
    localStorage.setItem(GUIDE_ENABLED_KEY, "0");
    const store = createGuideStore();
    primeGuideState(store, matching(WIDE_QUERY), yesWebGL);
    expect(store.getState().enabled).toBe(false);
  });

  it("stays off without WebGL", () => {
    const store = createGuideStore();
    primeGuideState(store, matching(WIDE_QUERY), () => false);
    expect(store.getState().enabled).toBe(false);
  });

  it("frees the rail without remembering a choice when WebGL is missing", () => {
    primeGuideState(createGuideStore(), matching(WIDE_QUERY), () => false);
    expect(document.documentElement.dataset.guide).toBe("off");
    expect(localStorage.getItem(GUIDE_ENABLED_KEY)).toBeNull();
  });

  it("leaves the rail reserved when WebGL is available", () => {
    primeGuideState(createGuideStore(), matching(WIDE_QUERY), yesWebGL);
    expect(document.documentElement.dataset.guide).toBeUndefined();
  });
});

describe("failGuide", () => {
  it("finishes the intro, turns the guide off and frees the rail without persisting", () => {
    const store = createGuideStore({ ...INITIAL_STATE, enabled: true, intro: "hello" });
    failGuide(store);
    expect(store.getState()).toMatchObject({ enabled: false, intro: "done" });
    expect(document.documentElement.dataset.guide).toBe("off");
    expect(localStorage.getItem(GUIDE_ENABLED_KEY)).toBeNull();
  });
});
