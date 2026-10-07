"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import { easing } from "maath";
import * as THREE from "three";
import { pxToWorld, resolveAnchor, worldToPx, yawToward } from "./anchors";
import { bubbleAnchor } from "./bubbleAnchor";
import { debugInfo } from "./debugInfo";
import { nextClip } from "./clipMachine";
import { MODEL, stopFor } from "./config";
import { flashHighlight } from "./highlight";
import { hoverGaze } from "./hoverGaze";
import { createHeadLook, lookAngles, pickGaze, type GazeInput } from "./look";
import { guideStore } from "./store";
import type { ClipName } from "./types";
import { usePointer } from "./usePointer";
import { useTargetCenter } from "./useTargetCenter";

const ARRIVE_PX = 4;
const MAX_YAW = 0.6; // rad (~34°): the body turns a fixed amount toward the target side (docs/02 §5)
const MAX_HEAD_YAW = (40 * Math.PI) / 180; // docs/02 §5
const MAX_HEAD_PITCH = (20 * Math.PI) / 180;
// Axis conventions depend on the rig's bone orientation; flip these when a new model looks the wrong way.
const HEAD_YAW_SIGN = 1;
const HEAD_PITCH_SIGN = 1;
const LOGICAL = Object.keys(MODEL.clipMap) as ClipName[];

// Scratch objects: nothing is allocated inside useFrame (R2.6; R1's Background.jsx allocated every frame).
const target = new THREE.Vector3();
const targetScale = new THREE.Vector3();
const yawTarget = new THREE.Euler();
const headWorld = new THREE.Vector3();
const gazeInput: GazeInput = { cursor: null, cursorActive: false, hover: null, target: null, resting: false, reducedMotion: false, mode: "wide" };

/** The frame loop from docs/04-system-design.md §2. */
export function GuideAvatar() {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const { scene, animations } = useGLTF(MODEL.url);
  // Keep this above this component's useFrame: drei's mixer.update must run before the head offset (same-priority
  // R3F subscribers run in registration order); reordering makes the head look flicker or vanish.
  const { actions, mixer } = useAnimations(animations, body);
  const size = useThree((s) => s.size);

  const { height, centerY } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    return { height: box.getSize(new THREE.Vector3()).y || 1, centerY: box.getCenter(new THREE.Vector3()).y };
  }, [scene]);

  // three.js actions are imperative objects; keep them in a ref so mutating them is explicit to the compiler.
  const actionsRef = useRef(actions);
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  const current = useRef<ClipName | null>(null);
  const finished = useRef(new Set<ClipName>());
  const placed = useRef(false);
  const lastStop = useRef<string | null>(null);
  const arrivedAt = useRef<string | null>(null);
  const { center, track, refresh } = useTargetCenter();
  const { pointer, isActive } = usePointer();
  const headBone = useMemo(() => scene.getObjectByName(MODEL.headBone) ?? null, [scene]);
  const headLook = useMemo(() => (headBone ? createHeadLook() : null), [headBone]);
  const headAngles = useRef({ yaw: 0, pitch: 0 });

  useEffect(() => {
    guideStore.markModelReady();
    return () => {
      bubbleAnchor.visible = false;
    };
  }, []);

  useEffect(() => {
    const onFinished = (e: { action: THREE.AnimationAction }) => {
      const name = e.action.getClip().name;
      for (const c of LOGICAL) if (MODEL.clipMap[c] === name) finished.current.add(c);
    };
    mixer.addEventListener("finished", onFinished);
    return () => mixer.removeEventListener("finished", onFinished);
  }, [mixer]);

  const play = (clip: ClipName) => {
    const name = MODEL.clipMap[clip];
    const next = actionsRef.current[name];
    if (!next) return;
    const prevName = current.current ? MODEL.clipMap[current.current] : null;
    if (prevName && prevName !== name) actionsRef.current[prevName]?.fadeOut(0.3);
    finished.current.delete(clip);
    next.reset();
    if (MODEL.once.includes(clip)) {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity);
    }
    next.fadeIn(prevName === name ? 0 : 0.3).play(); // crossfade as in R1.5
    current.current = clip;
  };

  useFrame((_, dt) => {
    const s = guideStore.getState();
    const stop = stopFor(s.section);
    const v = { w: size.width, h: size.height };
    const inIntro = s.intro === "pending" || s.intro === "hello";
    const staging = s.stage !== null;

    const anchor = resolveAnchor(s.mode, s.intro, s.stage !== null, v);
    const world = pxToWorld(anchor, v);
    target.set(world.x, world.y, 0);
    targetScale.setScalar(anchor.heightPx / height);

    if (stop.id !== lastStop.current) {
      lastStop.current = stop.id;
      arrivedAt.current = null;
      finished.current.delete(stop.clip);
      track(stop.target ? document.querySelector(stop.target) : null);
    }

    if (!placed.current || s.reducedMotion) {
      root.current.position.copy(target);
      root.current.scale.copy(targetScale);
      placed.current = true;
    } else {
      easing.damp3(root.current.position, target, 0.35, dt);
      easing.damp3(root.current.scale, targetScale, 0.35, dt);
    }
    const moving = root.current.position.distanceTo(target) > ARRIVE_PX;

    if (!moving && !inIntro && arrivedAt.current !== stop.id) {
      arrivedAt.current = stop.id;
      guideStore.arrive(stop);
      refresh();
      if (stop.target) flashHighlight(stop.target);
    }

    const avatarPx = worldToPx(root.current.position, v);
    // Raw viewport px for the cursor (no layout reads); the section target comes from the cached centre.
    const resting = s.intro === "done" && !staging;
    const sectionTarget = !inIntro && !staging ? center.current : null;
    gazeInput.cursor = pointer.current;
    gazeInput.cursorActive = isActive(Date.now());
    gazeInput.hover = s.hover ? hoverGaze.center.current : null; // measured on dwell and on scroll, never per frame
    gazeInput.target = sectionTarget;
    gazeInput.resting = resting;
    gazeInput.reducedMotion = s.reducedMotion;
    gazeInput.mode = s.mode;
    const gaze = pickGaze(gazeInput);
    yawTarget.set(0, yawToward(gaze?.x ?? null, avatarPx.x, MAX_YAW), 0);
    if (s.reducedMotion) body.current.rotation.copy(yawTarget);
    else easing.dampE(body.current.rotation, yawTarget, 0.25, dt);

    const clip = nextClip({
      intro: s.intro,
      moving,
      staging,
      reducedMotion: s.reducedMotion,
      stopClip: stop.clip,
      finished: finished.current,
    });
    if (clip !== current.current) play(clip);

    if (headBone && headLook) {
      // After the clip step: drei's mixer already ran this frame, so the bone holds the animated pose.
      const angles = headAngles.current;
      if (s.reducedMotion) {
        angles.yaw = 0;
        angles.pitch = 0;
      } else {
        headBone.getWorldPosition(headWorld);
        const want = lookAngles(
          gaze,
          worldToPx(headWorld, v),
          body.current.rotation.y,
          MAX_HEAD_YAW,
          MAX_HEAD_PITCH,
        );
        easing.damp(angles, "yaw", want.yaw, 0.15, dt);
        easing.damp(angles, "pitch", want.pitch, 0.15, dt);
      }
      headLook.apply(headBone, HEAD_YAW_SIGN * angles.yaw, HEAD_PITCH_SIGN * angles.pitch);
    }

    const heightPx = root.current.scale.y * height;
    bubbleAnchor.x = avatarPx.x;
    bubbleAnchor.top = avatarPx.y - heightPx / 2;
    bubbleAnchor.visible = true;
    // The literal NODE_ENV check is required for dead-code elimination in production; do not move it
    // into shouldShowDebug or a shared constant.
    if (process.env.NODE_ENV !== "production") {
      debugInfo.clip = current.current ?? "";
      debugInfo.stopId = stop.id;
      debugInfo.anchorX = anchor.x;
      debugInfo.anchorY = anchor.y;
      debugInfo.heightPx = anchor.heightPx;
      debugInfo.x = avatarPx.x;
      debugInfo.y = avatarPx.y;
      debugInfo.curHeightPx = heightPx;
      debugInfo.gaze = !gaze ? "none" : gaze === gazeInput.hover ? "hover" : gaze === sectionTarget ? "target" : "cursor";
    }
  });

  return (
    <group ref={root}>
      <group ref={body}>
        <group position-y={-centerY}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(MODEL.url);
