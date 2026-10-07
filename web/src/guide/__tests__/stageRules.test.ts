import { describe, expect, it } from "vitest";
import { GUIDE_STOPS, STAGE_HOLD_MS, STAGE_MAX_MS, STAGE_MIN_DWELL_MS, TYPE_CPS } from "../config";
import { shouldStage, stageDurationMs, type StageInput } from "../stageRules";

const ok: StageInput = {
  sectionId: "experience",
  staged: new Set(),
  dwellMs: STAGE_MIN_DWELL_MS,
  reducedMotion: false,
  mode: "wide",
  intro: "done",
  modelReady: true,
  stageActive: false,
  forced: false,
};

describe("shouldStage", () => {
  it("stages a new section after the minimum dwell", () => {
    expect(shouldStage(ok)).toBe(true);
  });
  it("never stages the hero (its stage is the intro)", () => {
    expect(shouldStage({ ...ok, sectionId: "hero" })).toBe(false);
    expect(shouldStage({ ...ok, sectionId: "hero", forced: true })).toBe(false);
  });
  it("stages each section once per page view", () => {
    expect(shouldStage({ ...ok, staged: new Set(["experience"]) })).toBe(false);
    expect(shouldStage({ ...ok, staged: new Set(["projects"]) })).toBe(true);
  });
  it("skips a section passed in under the dwell", () => {
    expect(shouldStage({ ...ok, dwellMs: STAGE_MIN_DWELL_MS - 1 })).toBe(false);
  });
  it("skips under reduced motion", () => {
    expect(shouldStage({ ...ok, reducedMotion: true })).toBe(false);
  });
  it("skips in compact mode", () => {
    expect(shouldStage({ ...ok, mode: "compact" })).toBe(false);
  });
  it("skips until the intro is done", () => {
    for (const intro of ["pending", "hello", "leaving"] as const) expect(shouldStage({ ...ok, intro })).toBe(false);
  });
  it("skips until the model has rendered (a stage would hide the line behind an invisible bubble)", () => {
    expect(shouldStage({ ...ok, modelReady: false })).toBe(false);
    expect(shouldStage({ ...ok, modelReady: false, forced: true })).toBe(false);
  });
  it("skips while a stage is already running", () => {
    expect(shouldStage({ ...ok, stageActive: true })).toBe(false);
  });
  it("forced overrides already-staged and dwell only", () => {
    expect(shouldStage({ ...ok, forced: true, staged: new Set(["experience"]) })).toBe(true);
    expect(shouldStage({ ...ok, forced: true, dwellMs: 0 })).toBe(true);
    expect(shouldStage({ ...ok, forced: true, reducedMotion: true })).toBe(false);
    expect(shouldStage({ ...ok, forced: true, mode: "compact" })).toBe(false);
    expect(shouldStage({ ...ok, forced: true, intro: "hello" })).toBe(false);
    expect(shouldStage({ ...ok, forced: true, stageActive: true })).toBe(false);
    expect(shouldStage({ ...ok, forced: true, modelReady: false })).toBe(false);
  });
});

describe("stageDurationMs", () => {
  it("is typing time plus the hold for a short line", () => {
    expect(stageDurationMs(14)).toBeCloseTo((14 / TYPE_CPS) * 1000 + STAGE_HOLD_MS);
  });
  it("is capped for a long line", () => {
    expect(stageDurationMs(200)).toBe(STAGE_MAX_MS);
  });
  it("hits the cap for every real line", () => {
    // STAGE_HOLD_MS only matters for lines shorter than ~35 chars; today every GUIDE_STOPS line is longer, so the cap decides.
    for (const stop of GUIDE_STOPS) expect(stageDurationMs(stop.line?.length ?? 0), stop.id).toBe(STAGE_MAX_MS);
  });
});
