import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { createHeadLook, LOOK_DEPTH_PX, lookAngles } from "../look";

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

  it("leaves the base unchanged for zero yaw and pitch", () => {
    const base = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 0.2, 0.3));
    const b = bone(base.clone());
    createHeadLook().apply(b, 0, 0);
    expect(b.quaternion.angleTo(base)).toBeLessThan(1e-6);
  });
});
