import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGuideStore, INITIAL_STATE } from "../store";
import { GUIDE_STOPS } from "../config";

const hero = GUIDE_STOPS[0];
const experience = GUIDE_STOPS.find((s) => s.id === "experience")!;
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

  describe("stage", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());
    const ready = () => {
      const store = createGuideStore();
      store.set({ intro: "done", modelReady: true });
      return store;
    };

    it("starts a stage: records it, marks the section staged, says the line once", () => {
      const store = ready();
      store.setSection("experience");
      store.startStage("experience");
      expect(store.getState().stage).toEqual({ sectionId: "experience" });
      expect(store.staged.has("experience")).toBe(true);
      expect(store.getState().bubble?.text).toBe(experience.line);
    });

    it("ends a stage", () => {
      const store = ready();
      store.startStage("experience");
      store.endStage();
      expect(store.getState().stage).toBeNull();
      expect(store.staged.has("experience")).toBe(true);
    });

    it("ends the stage when the section changes (interrupt)", () => {
      const store = ready();
      store.setSection("experience");
      store.startStage("experience");
      store.setSection("projects");
      expect(store.getState().stage).toBeNull();
    });

    it("does not say a staged line again when the robot reaches the corner", () => {
      const store = ready();
      store.setSection("experience");
      store.startStage("experience");
      store.endStage();
      store.set({ bubble: null });
      store.arrive(experience);
      expect(store.getState().bubble).toBeNull();
    });

    it("tracks how long the current section has been active", () => {
      const store = ready();
      store.setSection("experience");
      vi.advanceTimersByTime(900);
      expect(store.dwellMs()).toBe(900);
      store.setSection("projects");
      expect(store.dwellMs()).toBe(0);
    });

    it("holds the corner line back for a section that is about to stage, then speaks it from the stage", () => {
      const store = ready();
      store.setSection("experience");
      store.arrive(experience);
      expect(store.getState().bubble).toBeNull();
      store.startStage("experience");
      expect(store.getState().bubble?.text).toBe(experience.line);
    });

    it("still speaks from the corner when staging is skipped (reduced motion, compact, already staged)", () => {
      for (const partial of [{ reducedMotion: true }, { mode: "compact" as const }]) {
        const store = ready();
        store.set(partial);
        store.setSection("experience");
        store.arrive(experience);
        expect(store.getState().bubble?.text).toBe(experience.line);
      }
      const store = ready();
      store.setSection("experience");
      store.startStage("experience");
      store.endStage();
      store.setSection("projects");
      store.setSection("experience");
      store.arrive(experience); // already spoken: stays quiet, no double speak
      expect(store.getState().bubble).toBeNull();
    });

    it("does not stage before the model has rendered", () => {
      const store = ready();
      store.set({ modelReady: false });
      store.setSection("experience");
      expect(store.canStage("experience", { dwellMs: Infinity })).toBe(false);
    });

    it("skipStage speaks the section's line once, only when the intro is done and the model rendered", () => {
      const store = ready();
      store.set({ modelReady: false });
      store.setSection("experience");
      store.skipStage("experience");
      expect(store.getState().bubble).toBeNull();
      store.set({ modelReady: true, intro: "leaving" });
      store.skipStage("experience");
      expect(store.getState().bubble).toBeNull();
      store.set({ intro: "done" });
      store.skipStage("experience");
      expect(store.getState().bubble?.text).toBe(experience.line);
      store.set({ bubble: null });
      store.skipStage("experience");
      expect(store.getState().bubble).toBeNull();
    });

    it("never stages the section that cut the intro short, but still speaks its line from the corner", () => {
      const store = ready();
      store.set({ intro: "leaving" });
      store.setSection("about");
      expect(store.getState().intro).toBe("done");
      expect(store.canStage("about", { dwellMs: Infinity })).toBe(false);
      store.arrive(GUIDE_STOPS.find((s) => s.id === "about")!);
      expect(store.getState().bubble).not.toBeNull();
    });

    it("answers whether a section may stage right now, with a stop required", () => {
      const store = ready();
      store.setSection("experience");
      vi.advanceTimersByTime(700);
      expect(store.canStage("experience")).toBe(true);
      expect(store.canStage("linkedin")).toBe(false);
      store.startStage("experience");
      expect(store.canStage("experience")).toBe(false);
    });
  });
});
