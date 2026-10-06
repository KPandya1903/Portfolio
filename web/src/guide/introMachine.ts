import type { IntroPhase } from "./types";

export type IntroEvent =
  | "MODEL_READY"
  | "HELLO_DONE"
  | "ARRIVED"
  | "LEFT_HERO"
  | "LOAD_TIMEOUT"
  | "FAILED"
  | "ALREADY_SEEN"
  | "REDUCED_MOTION";

/** docs/04-system-design.md §4.1 */
export function introReducer(phase: IntroPhase, event: IntroEvent): IntroPhase {
  if (phase === "done") return "done";
  switch (event) {
    case "ALREADY_SEEN":
    case "REDUCED_MOTION":
    case "LEFT_HERO":
    case "FAILED":
      return "done";
    case "LOAD_TIMEOUT":
      return phase === "pending" ? "done" : phase;
    case "MODEL_READY":
      return phase === "pending" ? "hello" : phase;
    case "HELLO_DONE":
      return phase === "hello" ? "leaving" : phase;
    case "ARRIVED":
      return phase === "leaving" ? "done" : phase;
  }
}
