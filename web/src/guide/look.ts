import * as THREE from "three";

/** Nominal viewing depth in px: how far "in front of" the screen the head's gaze converges (docs/02 §5). */
export const LOOK_DEPTH_PX = 600;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Head yaw/pitch (rad) toward a screen-px target. Yaw is relative to the body; positive pitch looks DOWN the screen
 * (y is down in px). No target means look straight ahead.
 */
export function lookAngles(
  target: { x: number; y: number } | null,
  head: { x: number; y: number },
  bodyYaw: number,
  maxYaw: number,
  maxPitch: number,
): { yaw: number; pitch: number } {
  if (!target) return { yaw: 0, pitch: 0 };
  const yaw = Math.atan2(target.x - head.x, LOOK_DEPTH_PX) - bodyYaw;
  const pitch = Math.atan2(target.y - head.y, LOOK_DEPTH_PX);
  return { yaw: clamp(yaw, -maxYaw, maxYaw), pitch: clamp(pitch, -maxPitch, maxPitch) };
}

/**
 * Applies a yaw/pitch offset on top of whatever the animation mixer wrote to a bone. The mixer only rewrites a
 * bone on frames where the current clip has a track for it; if it did not, the bone still holds last frame's
 * result, so we restore the pre-offset base first instead of stacking the offset every frame.
 */
export function createHeadLook() {
  const lastBase = new THREE.Quaternion();
  const lastApplied = new THREE.Quaternion();
  const offset = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, "YXZ");
  let primed = false;

  return {
    apply(bone: { quaternion: THREE.Quaternion }, yaw: number, pitch: number): void {
      const q = bone.quaternion;
      if (primed && q.equals(lastApplied)) q.copy(lastBase);
      lastBase.copy(q);
      euler.set(pitch, yaw, 0, "YXZ");
      offset.setFromEuler(euler);
      q.multiply(offset);
      lastApplied.copy(q);
      primed = true;
    },
  };
}
