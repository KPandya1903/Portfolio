import { describe, expect, it } from "vitest";
import { HOVER_COOLDOWN_MS, HOVER_LINES } from "../config";
import { hoverAllowed, INITIAL_HOVER, nextHover, type HoverContext, type HoverEvent, type HoverState } from "../hoverRules";

const ok: HoverContext = { intro: "done", staging: false, mode: "wide", reducedMotion: false };
const A = "project-nexusmesh";
const B = "project-taskpulse";
const NO_LINE = "journey-acm";
const run = (state: HoverState, e: HoverEvent, now = 1000) => nextHover(state, e, now);
/** enter + dwell-complete */
const look = (id: string, now: number, from: HoverState = INITIAL_HOVER, ctx = ok) =>
  run(run(from, { type: "enter", id, ctx }, now).state, { type: "dwell-complete", id, ctx }, now);

describe("hoverAllowed", () => {
  it("allows a wide, motion-friendly page after the intro with no stage", () => {
    expect(hoverAllowed(ok)).toBe(true);
  });
  it.each([
    ["the intro has not finished", { ...ok, intro: "hello" }],
    ["the intro is pending", { ...ok, intro: "pending" }],
    ["a stage is running", { ...ok, staging: true }],
    ["compact mode", { ...ok, mode: "compact" }],
    ["reduced motion", { ...ok, reducedMotion: true }],
  ])("refuses while %s", (_n, ctx) => {
    expect(hoverAllowed(ctx)).toBe(false);
  });
});

describe("nextHover", () => {
  it("has a line for the test ids", () => {
    expect(HOVER_LINES[A]).toBeTruthy();
    expect(HOVER_LINES[B]).toBeTruthy();
    expect(HOVER_LINES[NO_LINE]).toBeUndefined();
  });

  it("enter only starts the dwell: no look and no line yet", () => {
    const r = run(INITIAL_HOVER, { type: "enter", id: A, ctx: ok });
    expect(r.state.hoverId).toBe(A);
    expect(r.say).toBeUndefined();
    expect(r.lookId).toBeUndefined();
  });

  it("ignores enter when hover is not allowed", () => {
    for (const ctx of [{ ...ok, intro: "hello" }, { ...ok, staging: true }, { ...ok, mode: "compact" }, { ...ok, reducedMotion: true }]) {
      const r = run(INITIAL_HOVER, { type: "enter", id: A, ctx });
      expect(r.state).toEqual(INITIAL_HOVER);
    }
  });

  it("dwell-complete looks at the item and says its line", () => {
    const r = look(A, 5000);
    expect(r.lookId).toBe(A);
    expect(r.say).toBe(HOVER_LINES[A]);
    expect(r.state.lookId).toBe(A);
    expect(r.state.lastSayAt).toBe(5000);
  });

  it("looks silently when the id has no line, and does not start the cooldown", () => {
    const r = look(NO_LINE, 5000);
    expect(r.lookId).toBe(NO_LINE);
    expect(r.say).toBeUndefined();
    expect(r.state.lastSayAt).toBeNull();
  });

  it("ignores a dwell-complete for an item that is no longer hovered", () => {
    const entered = run(INITIAL_HOVER, { type: "enter", id: A, ctx: ok }).state;
    const left = run(entered, { type: "leave", id: A }).state;
    const r = run(left, { type: "dwell-complete", id: A, ctx: ok });
    expect(r.lookId).toBeUndefined();
    expect(r.say).toBeUndefined();
    const other = run(entered, { type: "dwell-complete", id: B, ctx: ok });
    expect(other.lookId).toBeUndefined();
  });

  it("dwell-complete when hover became disallowed drops the hover without a line", () => {
    const entered = run(INITIAL_HOVER, { type: "enter", id: A, ctx: ok }).state;
    const r = run(entered, { type: "dwell-complete", id: A, ctx: { ...ok, staging: true } });
    expect(r.say).toBeUndefined();
    expect(r.state.hoverId).toBeNull();
    expect(r.state.lookId).toBeNull();
  });

  it("says nothing for a second item inside the cooldown, but still looks at it", () => {
    const first = look(A, 10_000);
    const second = look(B, 10_000 + HOVER_COOLDOWN_MS - 1, first.state);
    expect(second.lookId).toBe(B);
    expect(second.say).toBeUndefined();
    expect(second.state.lastSayAt).toBe(10_000);
  });

  it("speaks again once the cooldown has elapsed, measured from the last line", () => {
    const first = look(A, 10_000);
    const second = look(B, 10_000 + HOVER_COOLDOWN_MS, first.state);
    expect(second.say).toBe(HOVER_LINES[B]);
    expect(second.state.lastSayAt).toBe(10_000 + HOVER_COOLDOWN_MS);
  });

  it("a silent look does not extend the cooldown", () => {
    const first = look(A, 10_000);
    const silent = look(NO_LINE, 12_000, first.state);
    const third = look(B, 10_000 + HOVER_COOLDOWN_MS, silent.state);
    expect(third.say).toBe(HOVER_LINES[B]);
  });

  it("may repeat the same item's line after the cooldown", () => {
    const first = look(A, 10_000);
    const again = look(A, 10_000 + HOVER_COOLDOWN_MS + 1, first.state);
    expect(again.say).toBe(HOVER_LINES[A]);
  });

  it("leave stops the hover but keeps the look until leave-complete", () => {
    const first = look(A, 10_000);
    const left = run(first.state, { type: "leave", id: A });
    expect(left.state.hoverId).toBeNull();
    expect(left.state.lookId).toBe(A);
    expect(left.lookId).toBeUndefined();
    const done = run(left.state, { type: "leave-complete" });
    expect(done.lookId).toBeNull();
    expect(done.state.lookId).toBeNull();
    expect(done.state.lastSayAt).toBe(10_000);
  });

  it("leave for a different item than the hovered one is ignored", () => {
    const first = look(A, 10_000);
    const r = run(first.state, { type: "leave", id: B });
    expect(r.state.hoverId).toBe(A);
  });

  it("leave-complete does nothing while an item is hovered again", () => {
    const first = look(A, 10_000);
    const moved = run(run(first.state, { type: "leave", id: A }).state, { type: "enter", id: B, ctx: ok }).state;
    const r = run(moved, { type: "leave-complete" });
    expect(r.lookId).toBeUndefined();
    expect(r.state.lookId).toBe(A);
  });

  it("leave-complete with nothing looked at reports no change", () => {
    expect(run(INITIAL_HOVER, { type: "leave-complete" }).lookId).toBeUndefined();
  });

  it("reset stops everything but remembers the last line time", () => {
    const first = look(A, 10_000);
    const r = run(first.state, { type: "reset" });
    expect(r.state).toEqual({ hoverId: null, lookId: null, lastSayAt: 10_000 });
    expect(r.lookId).toBeNull();
    expect(run(INITIAL_HOVER, { type: "reset" }).lookId).toBeUndefined();
  });
});
