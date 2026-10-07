"use client";
import { useEffect, useState } from "react";
import { debugInfo } from "./debugInfo";
import { guideStore, useGuide, type GuideStore } from "./store";

const REFRESH_MS = 100;
const snapshot = () => ({ ...debugInfo });
type Info = ReturnType<typeof snapshot>;
/** Same text on screen: strings equal, numbers equal once rounded. */
const sameDisplay = (a: Info, b: Info) =>
  (Object.keys(a) as (keyof Info)[]).every((k) => (typeof a[k] === "number" ? Math.round(a[k]) === Math.round(b[k] as number) : a[k] === b[k]));

/** Dev-only readout (x/y/height are the avatar now; "target" is where it is heading) (docs/04 §9), shown with `?guideDebug=1`. Per-frame values are polled, not React state. */
export function GuideDebug({ store = guideStore }: { store?: GuideStore }) {
  const section = useGuide((s) => s.section, store);
  const intro = useGuide((s) => s.intro, store);
  const mode = useGuide((s) => s.mode, store);
  const reducedMotion = useGuide((s) => s.reducedMotion, store);
  const stage = useGuide((s) => s.stage, store);
  const hover = useGuide((s) => s.hover, store);
  const menuOpen = useGuide((s) => s.menuOpen, store);
  const [info, setInfo] = useState(snapshot);

  useEffect(() => {
    const id = setInterval(() => setInfo((prev) => {
        const next = snapshot();
        return sameDisplay(prev, next) ? prev : next;
      }), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const rows: [string, string | number][] = [
    ["section", section ?? "-"],
    ["intro", intro],
    ["stage", stage?.sectionId ?? "-"],
    ["hover", hover?.id ?? "-"],
    ["menu", menuOpen ? "open" : "closed"],
    ["mode", mode],
    ["reduced motion", reducedMotion ? "yes" : "no"],
    ["clip", info.clip || "-"],
    ["gaze", info.gaze],
    ["stop", info.stopId || "-"],
    ["target x", Math.round(info.anchorX)],
    ["target y", Math.round(info.anchorY)],
    ["target height", Math.round(info.heightPx)],
    ["x", Math.round(info.x)],
    ["y", Math.round(info.y)],
    ["height", Math.round(info.curHeightPx)],
  ];

  return (
    <div
      data-testid="guide-debug"
      aria-hidden="true"
      style={{
        position: "fixed",
        right: 8,
        bottom: 8,
        zIndex: 9999, // above all app layers (navbar 50)
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
