import { describe, expect, it } from "vitest";
import { nextClip, reactionActive, type ClipInput } from "../clipMachine";
import type { ClipName } from "../types";

const base: ClipInput = { intro: "done", moving: false, reducedMotion: false, staging: false, stopClip: "Point", finished: new Set() };
const done = (...c: ClipName[]) => new Set<ClipName>(c);

describe("nextClip", () => {
  it("waves first during the intro, then talks", () => {
    expect(nextClip({ ...base, intro: "hello" })).toBe("Wave");
    expect(nextClip({ ...base, intro: "hello", finished: done("Wave") })).toBe("Talk");
  });
  it("travels while moving", () => {
    expect(nextClip({ ...base, intro: "leaving", moving: true })).toBe("Travel");
    expect(nextClip({ ...base, moving: true })).toBe("Travel");
  });
  it("talks while staged (centre stage), but travels on the way there", () => {
    expect(nextClip({ ...base, staging: true })).toBe("Talk");
    expect(nextClip({ ...base, staging: true, stopClip: "ThumbsUp" })).toBe("Talk");
    expect(nextClip({ ...base, staging: true, moving: true })).toBe("Travel");
  });
  it("stays idle under reduced motion even if staged", () => {
    expect(nextClip({ ...base, staging: true, reducedMotion: true })).toBe("Idle");
  });
  it("plays the stop clip on arrival", () => {
    expect(nextClip(base)).toBe("Point");
    expect(nextClip({ ...base, stopClip: "Talk" })).toBe("Talk");
  });
  it("holds Point after it finishes (clamped pose)", () => {
    expect(nextClip({ ...base, finished: done("Point") })).toBe("Point");
  });
  it("returns to Idle after a thumbs up", () => {
    expect(nextClip({ ...base, stopClip: "ThumbsUp" })).toBe("ThumbsUp");
    expect(nextClip({ ...base, stopClip: "ThumbsUp", finished: done("ThumbsUp") })).toBe("Idle");
  });
  it("only idles under reduced motion", () => {
    expect(nextClip({ ...base, reducedMotion: true, moving: true })).toBe("Idle");
    expect(nextClip({ ...base, reducedMotion: true, intro: "hello" })).toBe("Idle");
  });
  it("never depends on time: same input, same output (R1.3 race)", () => {
    const input = { ...base, moving: true };
    expect(nextClip(input)).toBe(nextClip(input));
  });
  it("waves once when a click reaction is pending, then returns to the stop clip", () => {
    expect(nextClip({ ...base, reacting: true })).toBe("Wave");
    expect(nextClip({ ...base, reacting: true, finished: done("Wave") })).toBe("Point");
  });
  it("does not wave while moving, staged or under reduced motion", () => {
    expect(nextClip({ ...base, reacting: true, moving: true })).toBe("Travel");
    expect(nextClip({ ...base, reacting: true, staging: true })).toBe("Talk");
    expect(nextClip({ ...base, reacting: true, reducedMotion: true })).toBe("Idle");
  });
});

describe("reactionActive", () => {
  const facts = { finished: new Set<ClipName>(), staging: false, moving: false };
  it("stays active until Wave finishes", () => {
    expect(reactionActive(true, facts)).toBe(true);
    expect(reactionActive(true, { ...facts, finished: new Set<ClipName>(["Wave"]) })).toBe(false);
  });
  it("is dropped when a stage or a walk interrupts it, so it cannot replay later", () => {
    expect(reactionActive(true, { ...facts, staging: true })).toBe(false);
    expect(reactionActive(true, { ...facts, moving: true })).toBe(false);
  });
  it("never starts by itself", () => {
    expect(reactionActive(false, facts)).toBe(false);
  });
});
