import type { GuideStop, ModelConfig } from "./types";

export const SECTION_IDS = ["hero", "journey", "about", "experience", "projects", "linkedin", "skills", "contact"] as const;

export const INTRO = {
  line: "Hi, I'm Kunj. I'm finishing my MS in CS at Stevens in May 2027, and I build distributed systems and ML that ships.",
  helloMs: 4000,
  loadTimeoutMs: 4000,
};

// Single source of truth for the choreography (pattern: R2.10). Lines: docs/06-guide-script.md.
export const GUIDE_STOPS: GuideStop[] = [
  {
    id: "hero",
    clip: "Point",
    target: '[data-guide-target="resume"]',
    line: "Want the one-page version? My resume is right here.",
    wide: { y: 0.58 },
  },
  {
    id: "journey",
    clip: "Point",
    target: "#journey h2",
    line: "This is the path so far: Mumbai to Hoboken, research to production.",
    source: "metadata.bio[0], metadata.location",
    wide: { y: 0.55 },
  },
  {
    id: "about",
    clip: "Talk",
    line: "I like building systems from their primitives. Here's a bit more about me.",
    source: "metadata.bio[1]",
    wide: { y: 0.6 },
  },
  {
    id: "experience",
    clip: "Point",
    target: '[data-guide-target="experience-list"]',
    line: "Right now I build AI features for Fini's iOS app. Before that, a platform serving 10K+ requests a day.",
    source: "experience.ts (Fini), metadata.bio[2]",
    wide: { y: 0.55 },
  },
  {
    id: "projects",
    clip: "Point",
    target: "#projects h2",
    line: "Click any card. Every public project links straight to its repo.",
    source: "projects.ts githubRepo",
    wide: { y: 0.55 },
  },
  {
    id: "skills",
    clip: "Point",
    target: "#skills h2",
    line: "My toolbox, grouped by what each tool is for.",
    source: "skills.ts",
    wide: { y: 0.55 },
  },
  {
    id: "contact",
    clip: "ThumbsUp",
    target: '[data-guide-target="contact-links"]',
    line: "That's the tour! I'm open to new-grad SWE and ML roles. Say hi.",
    source: "metadata.availability",
    wide: { y: 0.6 },
  },
];

// Placeholder: three.js RobotExpressive (CC0). Swap per docs/05-avatar-pipeline.md step 6.
export const MODEL: ModelConfig = {
  url: "/guide/robot-expressive.glb",
  clipMap: { Wave: "Wave", Talk: "Yes", Point: "ThumbsUp", Idle: "Idle", Travel: "Walking", ThumbsUp: "ThumbsUp" },
  once: ["Wave", "Point", "ThumbsUp"],
  headBone: "Head", // Mixamo rigs: "mixamorigHead"
};

/** The stop for a section, or the nearest earlier section's stop (e.g. LinkedIn → Projects). */
export function stopFor(sectionId: string | null): GuideStop {
  const index = sectionId ? SECTION_IDS.indexOf(sectionId as (typeof SECTION_IDS)[number]) : 0;
  for (let i = Math.max(index, 0); i >= 0; i--) {
    const stop = GUIDE_STOPS.find((s) => s.id === SECTION_IDS[i]);
    if (stop) return stop;
  }
  return GUIDE_STOPS[0];
}
