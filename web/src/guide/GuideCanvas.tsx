"use client";
import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { GuideAvatar } from "./GuideAvatar";

function PauseWhenHidden() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  useEffect(() => {
    const onVisibility = () => setFrameloop(document.hidden ? "never" : "always");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [setFrameloop]);
  return null;
}

/** Fixed, transparent, click-through overlay (ADR-0001). Orthographic, 1 unit = 1 CSS px (ADR-0002). */
export function GuideCanvas() {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 1000], zoom: 1, near: 1, far: 4000 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      style={{ position: "fixed", inset: 0, zIndex: 40, pointerEvents: "none" }}
      aria-hidden="true"
      // R3F applies this to the wrapper div; it guards against the wrapper ever becoming focusable. Don't move it onto the canvas.
      tabIndex={-1}
      data-testid="guide-canvas"
    >
      <hemisphereLight args={["#FFF4EA", "#5D4037", 1.1]} />
      <directionalLight position={[400, 600, 800]} intensity={1.6} color="#FFE2CC" />
      <PauseWhenHidden />
      <Suspense fallback={null}>
        <GuideAvatar />
      </Suspense>
    </Canvas>
  );
}
