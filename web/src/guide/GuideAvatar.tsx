"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import { easing } from "maath";
import * as THREE from "three";
import { pxToWorld, resolveAnchor, worldToPx, yawToward } from "./anchors";
import { bubbleAnchor } from "./bubbleAnchor";
import { nextClip } from "./clipMachine";
import { MODEL, stopFor } from "./config";
import { flashHighlight } from "./highlight";
import { guideStore } from "./store";
import type { ClipName } from "./types";

const ARRIVE_PX = 4;
const MAX_YAW = 0.6; // rad (~34°), inside the ±70° limit in docs/02 §5
const LOGICAL = Object.keys(MODEL.clipMap) as ClipName[];

// Scratch objects: nothing is allocated inside useFrame (R2.6; R1's Background.jsx allocated every frame).
const target = new THREE.Vector3();
const targetScale = new THREE.Vector3();
const yawTarget = new THREE.Euler();

/** The frame loop from docs/04-system-design.md §2. */
export function GuideAvatar() {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const { scene, animations } = useGLTF(MODEL.url);
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
  const targetEl = useRef<Element | null>(null);

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

    const anchor = resolveAnchor(stop, s.mode, s.intro, v);
    const world = pxToWorld(anchor, v);
    target.set(world.x, world.y, 0);
    targetScale.setScalar(anchor.heightPx / height);

    if (stop.id !== lastStop.current) {
      lastStop.current = stop.id;
      arrivedAt.current = null;
      finished.current.delete(stop.clip);
      targetEl.current = stop.target ? document.querySelector(stop.target) : null;
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
      if (stop.target) flashHighlight(stop.target);
    }

    const avatarPx = worldToPx(root.current.position, v);
    let targetX: number | null = null;
    if (!inIntro && targetEl.current) {
      const r = targetEl.current.getBoundingClientRect();
      targetX = r.left + r.width / 2;
    }
    yawTarget.set(0, yawToward(targetX, avatarPx.x, MAX_YAW), 0);
    if (s.reducedMotion) body.current.rotation.copy(yawTarget);
    else easing.dampE(body.current.rotation, yawTarget, 0.25, dt);

    const clip = nextClip({
      intro: s.intro,
      moving,
      reducedMotion: s.reducedMotion,
      stopClip: stop.clip,
      finished: finished.current,
    });
    if (clip !== current.current) play(clip);

    const heightPx = root.current.scale.y * height;
    bubbleAnchor.x = avatarPx.x;
    bubbleAnchor.top = avatarPx.y - heightPx / 2;
    bubbleAnchor.visible = true;
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
