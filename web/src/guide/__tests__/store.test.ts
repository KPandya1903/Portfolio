import { describe, expect, it, vi } from "vitest";
import { createGuideStore, INITIAL_STATE } from "../store";
import { GUIDE_STOPS } from "../config";

const hero = GUIDE_STOPS[0];
const skills = GUIDE_STOPS.find((s) => s.id === "skills")!;

describe("guide store", () => {
  it("does not notify when nothing changed (R5.3)", () => {
    const store = createGuideStore();
    const spy = vi.fn();
    store.subscribe(spy);
    store.set({ mode: INITIAL_STATE.mode });
    expect(spy).not.toHaveBeenCalled();
    store.set({ mode: "compact" });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("clears the bubble on section change and ends the intro when leaving the hero", () => {
    const store = createGuideStore();
    store.markModelReady();
    store.say("hello");
    store.setSection("journey");
    expect(store.getState().bubble).toBeNull();
    expect(store.getState().intro).toBe("done");
  });

  it("finishes the intro on arrival, then speaks the hero line once", () => {
    const store = createGuideStore();
    store.markModelReady();
    store.dispatchIntro("HELLO_DONE");
    store.arrive(hero);
    expect(store.getState().intro).toBe("done");
    expect(store.getState().bubble?.text).toBe(hero.line);
    store.set({ bubble: null });
    store.arrive(hero);
    expect(store.getState().bubble).toBeNull();
  });

  it("stays quiet on arrival while the intro is still saying hello", () => {
    const store = createGuideStore();
    store.markModelReady();
    store.arrive(skills);
    expect(store.getState().bubble).toBeNull();
  });

  it("gives each bubble a new key so the typewriter restarts", () => {
    const store = createGuideStore();
    store.say("a");
    const first = store.getState().bubble!.key;
    store.say("a");
    expect(store.getState().bubble!.key).toBe(first + 1);
  });
});
