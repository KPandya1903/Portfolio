import { describe, expect, it } from "vitest";
import { bubbleBox, modeForWidth, pxToWorld, resolveAnchor, worldToPx, yawToward } from "../anchors";
import type { GuideStop } from "../types";

const stop: GuideStop = { id: "skills", clip: "Point" };
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
  it("rests in the bottom-left corner at 140 px after the intro (wide)", () => {
    expectAnchor(resolveAnchor(stop, "wide", "done", laptop), 58, 814, 140);
  });
  it("keeps the corner spot and height on very tall screens", () => {
    expectAnchor(resolveAnchor(stop, "wide", "done", { w: 2560, h: 1600 }), 58, 1514, 140);
  });
  it("walks to the corner when leaving the intro", () => {
    expectAnchor(resolveAnchor(stop, "wide", "leaving", laptop), 58, 814, 140);
  });
  it("rests in the same corner regardless of the stop", () => {
    const other: GuideStop = { id: "contact", clip: "ThumbsUp" };
    expect(resolveAnchor(other, "wide", "done", laptop)).toEqual(resolveAnchor(stop, "wide", "done", laptop));
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

describe("worldToPx", () => {
  it("inverts pxToWorld", () => {
    const p = { x: 140, y: 495 };
    expect(worldToPx(pxToWorld(p, laptop), laptop)).toEqual(p);
  });
});

describe("yawToward", () => {
  it("turns right toward a target on the right", () => {
    expect(yawToward(800, 140, 0.6)).toBe(0.6);
  });
  it("turns left toward a target on the left", () => {
    expect(yawToward(50, 140, 0.6)).toBe(-0.6);
  });
  it("faces forward with no target", () => {
    expect(yawToward(null, 140, 0.6)).toBe(0);
  });
  it("faces forward when the target is straight ahead", () => {
    expect(yawToward(140, 140, 0.6)).toBe(0);
  });
});

describe("bubbleBox", () => {
  it("centres the bubble over the avatar, 12 px above its head", () => {
    expect(bubbleBox({ x: 720, top: 300 }, 248, 1440)).toEqual({ left: 596, top: 288 });
  });
  it("keeps 12 px from the left edge (compact corner)", () => {
    expect(bubbleBox({ x: 52, top: 700 }, 220, 390).left).toBe(12);
  });
  it("keeps 12 px from the right edge", () => {
    expect(bubbleBox({ x: 1430, top: 300 }, 248, 1440).left).toBe(1440 - 248 - 12);
  });
});
