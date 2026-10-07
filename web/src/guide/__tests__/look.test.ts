import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { createHeadLook, LOOK_DEPTH_PX, lookAngles, pickGaze } from "../look";

const head = { x: 100, y: 300 };
const MAX_YAW = (40 * Math.PI) / 180;
const MAX_PITCH = (20 * Math.PI) / 180;
const angles = (t: { x: number; y: number } | null, bodyYaw = 0) =>
  lookAngles(t, head, bodyYaw, MAX_YAW, MAX_PITCH);

describe("lookAngles", () => {
  it("returns zeros without a target", () => {
    expect(angles(null)).toEqual({ yaw: 0, pitch: 0 });
  });

  it("looks right (positive yaw) and left (negative yaw)", () => {
    expect(angles({ x: 100 + 200, y: 300 }).yaw).toBeCloseTo(Math.atan2(200, LOOK_DEPTH_PX));
    expect(angles({ x: 100 - 200, y: 300 }).yaw).toBeCloseTo(-Math.atan2(200, LOOK_DEPTH_PX));
  });

  it("looks down the screen with positive pitch and up with negative", () => {
    expect(angles({ x: 100, y: 300 + 100 }).pitch).toBeCloseTo(Math.atan2(100, LOOK_DEPTH_PX));
    expect(angles({ x: 100, y: 300 - 100 }).pitch).toBeCloseTo(-Math.atan2(100, LOOK_DEPTH_PX));
  });

  it("clamps yaw and pitch", () => {
    const far = angles({ x: 100 + 5000, y: 300 + 5000 });
    expect(far.yaw).toBeCloseTo(MAX_YAW);
    expect(far.pitch).toBeCloseTo(MAX_PITCH);
    const farNeg = angles({ x: 100 - 5000, y: 300 - 5000 });
    expect(farNeg.yaw).toBeCloseTo(-MAX_YAW);
    expect(farNeg.pitch).toBeCloseTo(-MAX_PITCH);
  });

  it("subtracts the body yaw from the head yaw", () => {
    const t = { x: 100 + 200, y: 300 };
    expect(angles(t, 0.2).yaw).toBeCloseTo(Math.atan2(200, LOOK_DEPTH_PX) - 0.2);
  });
});

describe("lookAngles with body yaw", () => {
  it("clamps after subtracting the body yaw", () => {
    expect(angles({ x: 100 - 5000, y: 300 }, 0.6).yaw).toBeCloseTo(-MAX_YAW);
  });
});

describe("createHeadLook", () => {
  const offset = (yaw: number, pitch: number) =>
    new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, "YXZ"));
  const bone = (q: THREE.Quaternion) => ({ quaternion: q });

  it("does not accumulate when the mixer does not rewrite the bone", () => {
    const base = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 0.2, 0.3));
    const once = bone(base.clone());
    createHeadLook().apply(once, 0.4, 0.1);

    const many = bone(base.clone());
    const look = createHeadLook();
    for (let i = 0; i < 60; i++) look.apply(many, 0.4, 0.1);
    expect(many.quaternion.angleTo(once.quaternion)).toBeLessThan(1e-6);
  });

  it("applies the offset on top of a freshly written base", () => {
    const look = createHeadLook();
    const b = bone(new THREE.Quaternion());
    look.apply(b, 0.3, 0.1);
    const newBase = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.5, -0.4, 0.2));
    b.quaternion.copy(newBase); // mixer writes the bone
    look.apply(b, 0.3, 0.1);
    const expected = newBase.clone().multiply(offset(0.3, 0.1));
    expect(b.quaternion.angleTo(expected)).toBeLessThan(1e-6);
  });

  it("follows angle changes while the mixer is idle", () => {
    const base = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 0.2, 0.3));
    const b = bone(base.clone());
    const look = createHeadLook();
    look.apply(b, 0.4, 0.1);
    look.apply(b, 0.2, 0.05);
    expect(b.quaternion.angleTo(base.clone().multiply(offset(0.2, 0.05)))).toBeLessThan(1e-6);
  });

  it("leaves the base unchanged for zero yaw and pitch", () => {
    const base = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 0.2, 0.3));
    const b = bone(base.clone());
    createHeadLook().apply(b, 0, 0);
    expect(b.quaternion.angleTo(base)).toBeLessThan(1e-6);
  });
});

describe("pickGaze", () => {
  const cursor = { x: 900, y: 40 };
  const target = { x: 300, y: 500 };
  const hover = { x: 700, y: 400 };
  const base = { cursor, cursorActive: true, hover: null, target, resting: true, reducedMotion: false, mode: "wide" as const };

  it("follows the cursor when it is active and the robot is resting on a wide screen", () => {
    expect(pickGaze(base)).toBe(cursor);
  });
  it("falls back to the section target once the cursor is idle", () => {
    expect(pickGaze({ ...base, cursorActive: false })).toBe(target);
  });
  it("ignores the cursor while the robot is not resting (intro or stage)", () => {
    expect(pickGaze({ ...base, resting: false })).toBe(target);
  });
  it("ignores the cursor with reduced motion", () => {
    expect(pickGaze({ ...base, reducedMotion: true })).toBe(target);
  });
  it("ignores the cursor in compact mode", () => {
    expect(pickGaze({ ...base, mode: "compact" })).toBe(target);
  });
  it("returns null with no usable cursor and no target", () => {
    expect(pickGaze({ ...base, cursorActive: false, target: null })).toBeNull();
    expect(pickGaze({ ...base, cursor: null, target: null })).toBeNull();
  });
  it("uses the target when there is no cursor position yet", () => {
    expect(pickGaze({ ...base, cursor: null })).toBe(target);
  });
  it("returns null for an active cursor when not resting and there is no target", () => {
    expect(pickGaze({ ...base, resting: false, target: null })).toBeNull();
  });
  it("prefers a hovered item over the cursor and the section target", () => {
    expect(pickGaze({ ...base, hover })).toBe(hover);
    expect(pickGaze({ ...base, hover, cursorActive: false })).toBe(hover);
    expect(pickGaze({ ...base, hover, cursor: null, target: null })).toBe(hover);
  });
  it("falls back to the cursor again once the hover ends", () => {
    expect(pickGaze({ ...base, hover: null })).toBe(cursor);
  });
});
