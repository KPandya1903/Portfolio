import { describe, expect, it } from "vitest";
import { nextClip, type ClipInput } from "../clipMachine";
import type { ClipName } from "../types";

const base: ClipInput = { intro: "done", moving: false, reducedMotion: false, stopClip: "Point", finished: new Set() };
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
});
