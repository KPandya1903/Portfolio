/**
 * The dev overlay needs a non-production build AND `?guideDebug=1`. The nodeEnv check is defence in
 * depth: the call sites carry their own literal `process.env.NODE_ENV` check, which is what strips the code.
 */
export function shouldShowDebug(nodeEnv: string | undefined, search: string): boolean {
  return nodeEnv !== "production" && new URLSearchParams(search).get("guideDebug") === "1";
}
