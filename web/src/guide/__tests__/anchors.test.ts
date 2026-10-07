import { describe, expect, it } from "vitest";
import { YAW_DEADZONE_PX, bubbleBox, modeForWidth, pxToWorld, resolveAnchor, restingBox, worldToPx, yawToward } from "../anchors";
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
    expectAnchor(resolveAnchor("wide", "hello", false, laptop), 720, 468, 495);
  });
  it("treats pending like hello so the avatar first appears centred", () => {
    expect(resolveAnchor("wide", "pending", false, laptop)).toEqual(resolveAnchor("wide", "hello", false, laptop));
  });
  it("centres the avatar during the intro (compact)", () => {
    expectAnchor(resolveAnchor("compact", "hello", false, phone), 195, 422, 337.6);
  });
  it("rests in the bottom-left corner at 140 px after the intro (wide)", () => {
    expectAnchor(resolveAnchor("wide", "done", false, laptop), 58, 814, 140);
  });
  it("keeps the corner spot and height on very tall screens", () => {
    expectAnchor(resolveAnchor("wide", "done", false, { w: 2560, h: 1600 }), 58, 1514, 140);
  });
  it("walks to the corner when leaving the intro", () => {
    expectAnchor(resolveAnchor("wide", "leaving", false, laptop), 58, 814, 140);
  });
  it("goes to the centre at 45% of the viewport height while staging (wide)", () => {
    expectAnchor(resolveAnchor("wide", "done", true, laptop), 720, 468, 405);
  });
  it("clamps the stage height between 260 and 420 px", () => {
    expect(resolveAnchor("wide", "done", true, { w: 1440, h: 500 }).heightPx).toBe(260);
    expect(resolveAnchor("wide", "done", true, { w: 2560, h: 1600 }).heightPx).toBe(420);
  });
  it("walks back to the corner when the stage ends", () => {
    expectAnchor(resolveAnchor("wide", "done", false, laptop), 58, 814, 140);
  });
  it("lets the intro win over a stage", () => {
    expect(resolveAnchor("wide", "hello", true, laptop)).toEqual(resolveAnchor("wide", "hello", false, laptop));
  });
  it("docks bottom-left at 120 px in compact mode", () => {
    expectAnchor(resolveAnchor("compact", "done", false, phone), 52, 768, 120);
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
    const p = { x: 58, y: 814 };
    expect(worldToPx(pxToWorld(p, laptop), laptop)).toEqual(p);
  });
});

describe("yawToward", () => {
  it("turns right toward a target on the right", () => {
    expect(yawToward(800, 58, 0.6)).toBe(0.6);
  });
  it("turns left toward a target on the left", () => {
    expect(yawToward(-30, 58, 0.6)).toBe(-0.6);
  });
  it("faces forward with no target", () => {
    expect(yawToward(null, 58, 0.6)).toBe(0);
  });
  it("faces forward when the target is straight ahead", () => {
    expect(yawToward(58, 58, 0.6)).toBe(0);
  });
  it("faces forward inside the deadzone, on either side", () => {
    expect(YAW_DEADZONE_PX).toBe(40);
    expect(yawToward(58 + 39, 58, 0.6)).toBe(0);
    expect(yawToward(58 - 39, 58, 0.6)).toBe(0);
  });
  it("turns once the target is the deadzone away", () => {
    expect(yawToward(58 + 40, 58, 0.6)).toBe(0.6);
    expect(yawToward(58 - 40, 58, 0.6)).toBe(-0.6);
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

describe("restingBox", () => {
  it("is the corner box the resting avatar occupies: 16 px in, as tall as the rest height", () => {
    expect(restingBox("wide")).toEqual({ left: 16, bottom: 16, size: 140 });
    expect(restingBox("compact")).toEqual({ left: 16, bottom: 16, size: 120 });
  });
  it("contains the resting anchor, so the hotspot sits over the robot", () => {
    for (const [mode, v] of [["wide", laptop], ["compact", phone]] as const) {
      const box = restingBox(mode);
      const a = resolveAnchor(mode, "done", false, v);
      expect(a.heightPx).toBe(box.size);
      expect(a.y).toBe(v.h - box.bottom - box.size / 2);
      expect(a.x).toBeGreaterThan(box.left);
      expect(a.x).toBeLessThan(box.left + box.size);
    }
  });
});
