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

    it("a forced stage of an already-spoken section says its line again, with a new key", () => {
      const store = ready();
      store.setSection("experience");
      store.startStage("experience");
      const first = store.getState().bubble!;
      store.endStage();
      store.set({ bubble: null }); // opening the menu clears the bubble
      store.startStage("experience", { forced: true });
      expect(store.getState().bubble?.text).toBe(experience.line);
      expect(store.getState().bubble!.key).toBeGreaterThan(first.key);
    });

    it("an unforced stage of a spoken section does not repeat its line", () => {
      const store = ready();
      store.setSection("experience");
      store.startStage("experience");
      store.endStage();
      store.set({ bubble: null });
      store.startStage("experience");
      expect(store.getState().bubble).toBeNull();
    });

    it("tags a bubble as a line by default and as a hover line when asked", () => {
      const store = ready();
      store.say("Hello");
      expect(store.getState().bubble?.kind).toBe("line");
      store.say("Hovered", "hover");
      expect(store.getState().bubble).toMatchObject({ text: "Hovered", kind: "hover" });
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

    it("lets a deep-linked section stage later when it was entered before the model loaded", () => {
      const store = createGuideStore(); // intro is "pending": nothing was cut short
      store.setSection("projects");
      expect(store.getState().intro).toBe("done");
      store.set({ modelReady: true });
      expect(store.canStage("projects", { dwellMs: Infinity })).toBe(true);
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

  describe("hover", () => {
    it("starts empty and can be set", () => {
      const store = createGuideStore();
      expect(store.getState().hover).toBeNull();
      store.set({ hover: { id: "project-nexusmesh" } });
      expect(store.getState().hover).toEqual({ id: "project-nexusmesh" });
    });

    it("is cleared by a section change", () => {
      const store = createGuideStore();
      store.set({ hover: { id: "project-nexusmesh" } });
      store.setSection("projects");
      expect(store.getState().hover).toBeNull();
    });

    it("is cleared when a stage starts", () => {
      const store = createGuideStore();
      store.set({ intro: "done", modelReady: true, hover: { id: "project-nexusmesh" } });
      store.startStage("experience");
      expect(store.getState().hover).toBeNull();
    });

    it("lets a hover line repeat (it is not speak-once)", () => {
      const store = createGuideStore();
      store.say("same");
      const first = store.getState().bubble!.key;
      store.say("same");
      expect(store.getState().bubble!.key).toBe(first + 1);
    });
  });

  describe("menu and reaction", () => {
    it("toggles and closes the menu", () => {
      const store = createGuideStore();
      store.toggleMenu();
      expect(store.getState().menuOpen).toBe(true);
      store.toggleMenu();
      expect(store.getState().menuOpen).toBe(false);
      store.toggleMenu();
      store.closeMenu();
      expect(store.getState().menuOpen).toBe(false);
    });

    it("clears the speech bubble when the menu opens (they would overlap on a phone), not when it closes", () => {
      const store = createGuideStore();
      store.say("hello");
      store.toggleMenu();
      expect(store.getState().bubble).toBeNull();
      store.say("again");
      store.toggleMenu();
      expect(store.getState().bubble?.text).toBe("again");
    });

    it("closes the menu when the active section changes, and when a stage starts", () => {
      const store = createGuideStore();
      store.toggleMenu();
      store.setSection("projects");
      expect(store.getState().menuOpen).toBe(false);
      store.toggleMenu();
      store.startStage("projects");
      expect(store.getState().menuOpen).toBe(false);
    });

    it("react() sets a wave reaction with a fresh key each time", () => {
      const store = createGuideStore();
      store.react();
      const first = store.getState().reaction;
      expect(first?.clip).toBe("Wave");
      store.react();
      expect(store.getState().reaction?.key).not.toBe(first?.key);
    });

    it("react() does nothing under reduced motion", () => {
      const store = createGuideStore();
      store.set({ reducedMotion: true });
      store.react();
      expect(store.getState().reaction).toBeNull();
    });

    it("requestStage remembers the section until the stage starts", () => {
      const store = createGuideStore();
      store.requestStage("skills");
      expect(store.getState().forcedStage).toBe("skills");
      store.startStage("skills");
      expect(store.getState().forcedStage).toBeNull();
    });

    it("canStage honours forced for an already-staged, barely dwelled section", () => {
      const store = createGuideStore();
      store.set({ intro: "done", modelReady: true });
      store.startStage("skills");
      store.endStage();
      expect(store.canStage("skills", { dwellMs: 5000 })).toBe(false);
      expect(store.canStage("skills", { forced: true, dwellMs: 0 })).toBe(true);
    });
  });
});
