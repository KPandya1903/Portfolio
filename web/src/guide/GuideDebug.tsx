"use client";
import { useEffect, useState } from "react";
import { debugInfo } from "./debugInfo";
import { guideStore, useGuide, type GuideStore } from "./store";

const REFRESH_MS = 100;
const snapshot = () => ({ ...debugInfo });

/** Dev-only readout (docs/04 §9), shown with `?guideDebug=1`. Per-frame values are polled, not React state. */
export function GuideDebug({ store = guideStore }: { store?: GuideStore }) {
  const section = useGuide((s) => s.section, store);
  const intro = useGuide((s) => s.intro, store);
  const mode = useGuide((s) => s.mode, store);
  const reducedMotion = useGuide((s) => s.reducedMotion, store);
  const [info, setInfo] = useState(snapshot);

  useEffect(() => {
    const id = setInterval(() => setInfo(snapshot()), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const rows: [string, string | number][] = [
    ["section", section ?? "-"],
    ["intro", intro],
    ["mode", mode],
    ["reduced motion", reducedMotion ? "yes" : "no"],
    ["clip", info.clip || "-"],
    ["stop", info.stopId || "-"],
    ["anchor x", Math.round(info.anchorX)],
    ["anchor y", Math.round(info.anchorY)],
    ["height px", Math.round(info.heightPx)],
  ];

  return (
    <div
      data-testid="guide-debug"
      aria-hidden="true"
      style={{
        position: "fixed",
        right: 8,
        bottom: 8,
        zIndex: 2147483000,
        pointerEvents: "none",
        font: "10px/1.4 ui-monospace, monospace",
        background: "rgba(0,0,0,0.75)",
        color: "#9fe",
        padding: "6px 8px",
        borderRadius: 4,
      }}
    >
      {rows.map(([k, v]) => (
        <div key={k}>
          {k}: {v}
        </div>
      ))}
    </div>
  );
}
