// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../GuideCanvas", () => ({ GuideCanvas: () => null }));
vi.mock("../SpeechBubble", () => ({ SpeechBubble: () => null }));
vi.mock("../useGuideEnvironment", () => ({ useGuideEnvironment: () => {} }));
vi.mock("../useActiveSection", () => ({ useActiveSection: () => {} }));
vi.mock("../useIntroSequence", () => ({ useIntroSequence: () => {} }));

import GuideRoot from "../GuideRoot";
import { guideStore } from "../store";

afterEach(() => {
  cleanup();
  guideStore.set({ bubble: null });
});

describe("GuideRoot", () => {
  it("clears the spoken bubble on unmount so re-enabling does not replay it", () => {
    render(<GuideRoot />);
    guideStore.say("Welcome");
    expect(guideStore.getState().bubble?.text).toBe("Welcome");
    cleanup();
    expect(guideStore.getState().bubble).toBeNull();
  });

  it("also drops the menu, a pending reaction and a forced stage on unmount", () => {
    render(<GuideRoot />);
    guideStore.toggleMenu();
    guideStore.react();
    guideStore.requestStage("skills");
    guideStore.markModelReady();
    cleanup();
    const s = guideStore.getState();
    expect(s.menuOpen).toBe(false);
    expect(s.reaction).toBeNull();
    expect(s.forcedStage).toBeNull();
    expect(s.modelReady).toBe(false);
  });
});
