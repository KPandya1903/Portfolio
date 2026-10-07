import { describe, expect, it } from "vitest";
import { introReducer, type IntroEvent } from "../introMachine";
import type { IntroPhase } from "../types";

const run = (events: IntroEvent[], from: IntroPhase = "pending") => events.reduce(introReducer, from);

describe("introReducer", () => {
  it("runs the happy path", () => {
    expect(run(["MODEL_READY"])).toBe("hello");
    expect(run(["MODEL_READY", "HELLO_DONE"])).toBe("leaving");
    expect(run(["MODEL_READY", "HELLO_DONE", "ARRIVED"])).toBe("done");
  });
  it("skips the intro for a returning session or reduced motion", () => {
    expect(run(["ALREADY_SEEN"])).toBe("done");
    expect(run(["REDUCED_MOTION"])).toBe("done");
  });
  it("ends the intro when the visitor scrolls away (no skip button, D3)", () => {
    expect(run(["MODEL_READY", "LEFT_HERO"])).toBe("done");
  });
  it("gives up only if the model never loaded", () => {
    expect(run(["LOAD_TIMEOUT"])).toBe("done");
    expect(run(["MODEL_READY", "LOAD_TIMEOUT"])).toBe("hello");
  });
  it("ends the intro from any phase when the guide fails", () => {
    expect(run(["FAILED"])).toBe("done");
    expect(run(["MODEL_READY", "FAILED"])).toBe("done");
    expect(run(["MODEL_READY", "HELLO_DONE", "FAILED"])).toBe("done");
  });
  it("ignores events that don't apply", () => {
    expect(run(["HELLO_DONE"])).toBe("pending");
    expect(run(["ARRIVED"])).toBe("pending");
  });
  it("never leaves done", () => {
    expect(run(["MODEL_READY", "HELLO_DONE"], "done")).toBe("done");
    expect(run(["MODEL_READY"], "done")).toBe("done"); // a repeated MODEL_READY (re-enabling the guide) is ignored
  });
});
