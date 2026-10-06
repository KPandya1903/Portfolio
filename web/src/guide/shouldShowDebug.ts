/** The dev overlay needs a non-production build AND `?guideDebug=1`. */
export function shouldShowDebug(nodeEnv: string | undefined, search: string): boolean {
  return nodeEnv !== "production" && new URLSearchParams(search).get("guideDebug") === "1";
}
