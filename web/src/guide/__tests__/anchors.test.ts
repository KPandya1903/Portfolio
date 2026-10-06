import { describe, expect, it } from "vitest";
import { modeForWidth, pxToWorld, resolveAnchor } from "../anchors";
import type { GuideStop } from "../types";

const stop: GuideStop = { id: "skills", clip: "Point", wide: { y: 0.55 } };
const laptop = { w: 1440, h: 900 };
const phone = { w: 390, h: 844 };

// Fractions of the viewport are not exact in floating point (0.55 * 900 = 495.00000000000006).
const expectAnchor = (a: { x: number; y: number; heightPx: number }, x: number, y: number, heightPx: number) => {
  expect(a.x).toBeCloseTo(x);
  expect(a.y).toBeCloseTo(y);
  expect(a.heightPx).toBeCloseTo(heightPx);
};

describe("resolveAnchor", () => {
  it("centres the avatar during the intro (wide)", () => {
    expectAnchor(resolveAnchor(stop, "wide", "hello", laptop), 720, 468, 495);
  });
  it("treats pending like hello so the avatar first appears centred", () => {
    expect(resolveAnchor(stop, "wide", "pending", laptop)).toEqual(resolveAnchor(stop, "wide", "hello", laptop));
  });
  it("centres the avatar during the intro (compact)", () => {
    expectAnchor(resolveAnchor(stop, "compact", "hello", phone), 195, 422, 337.6);
  });
  it("puts the avatar in the rail after the intro", () => {
    expectAnchor(resolveAnchor(stop, "wide", "done", laptop), 140, 495, 378);
  });
  it("clamps rail height on very tall screens", () => {
    expect(resolveAnchor(stop, "wide", "done", { w: 2560, h: 1600 }).heightPx).toBe(420);
  });
  it("docks bottom-left at 120 px in compact mode", () => {
    expectAnchor(resolveAnchor(stop, "compact", "done", phone), 52, 768, 120);
  });
});

describe("pxToWorld", () => {
  it("maps the viewport centre to the origin", () => {
    expect(pxToWorld({ x: 720, y: 450 }, laptop)).toEqual({ x: 0, y: 0 });
  });
  it("flips y and moves the origin to the top-left corner", () => {
    expect(pxToWorld({ x: 0, y: 0 }, laptop)).toEqual({ x: -720, y: 450 });
  });
});

describe("modeForWidth", () => {
  it("switches at 1280 px", () => {
    expect(modeForWidth(1280)).toBe("wide");
    expect(modeForWidth(1279)).toBe("compact");
  });
});
