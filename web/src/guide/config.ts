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
  },
  {
    id: "journey",
    clip: "Point",
    target: "#journey h2",
    line: "This is the path so far: Mumbai to Hoboken, research to production.",
    source: "metadata.bio[0], metadata.location",
  },
  {
    id: "about",
    clip: "Talk",
    line: "I like building systems from their primitives. Here's a bit more about me.",
    source: "metadata.bio[1]",
  },
  {
    id: "experience",
    clip: "Point",
    target: '[data-guide-target="experience-list"]',
    line: "Right now I build AI features for Fini's iOS app. Before that, a platform serving 10K+ requests a day.",
    source: "experience.ts (Fini), metadata.bio[2]",
  },
  {
    id: "projects",
    clip: "Point",
    target: "#projects h2",
    line: "Click any card. Every public project links straight to its repo.",
    source: "projects.ts githubRepo",
  },
  {
    id: "skills",
    clip: "Point",
    target: "#skills h2",
    line: "My toolbox, grouped by what each tool is for.",
    source: "skills.ts",
  },
  {
    id: "contact",
    clip: "ThumbsUp",
    target: '[data-guide-target="contact-links"]',
    line: "That's the tour! I'm open to new-grad SWE and ML roles. Say hi.",
    source: "metadata.availability",
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

/** Center stage timings (docs/superpowers/plans/2026-10-06-interactive-guide.md): ignore sections passed in under the dwell; every stage lasts the same time (every line is typed well within it). */
export const STAGE_MIN_DWELL_MS = 700;
export const STAGE_MAX_MS = 4500;
/** Speech bubble typing speed, characters per second. */
export const TYPE_CPS = 35;
export const POINTER_IDLE_MS = 2000;

/** Hover reactions (plan table "Hover reactions"): dwell before the robot reacts, one line per cooldown, grace before it stops looking. */
export const HOVER_DWELL_MS = 350;
export const HOVER_COOLDOWN_MS = 6000;
export const HOVER_LEAVE_MS = 800;
/** One short first-person line per hover id (project-*, skills-*, exp-*, journey-*). An id with no line is looked at silently. */
export const HOVER_LINES: Record<string, string> = {
  "project-edara": "Edara is a private repo, so there's no link. Ask Kunj for a walkthrough.",
  "project-nexusmesh": "A Chord DHT built from primitives: under 5 ms p99 lookups in a 100-node network.",
  "project-taskpulse": "TaskPulse stops retry storms with a Redis priority queue, idempotent execution and bounded backoff.",
  "project-fleetiq": "FleetIQ reached 98.15% OCR success and produced 591 matched entry-exit pairs.",
  "project-doclens": "DocLens runs search and chat on Cloudflare's edge, with about 70 ms cold starts, and it's live.",
  "project-vaultchat": "In VaultChat the server only ever stores ciphertext. No plaintext field exists.",
  "project-tradeflow": "TradeFlow is a paper trading platform with real-time pricing and forecasting.",
  "project-i-wizard": "I Wizard won 1st place at QuackHacks '26, built in a 24-hour hackathon.",
  "project-wizard-duel": "Wizard Duel is a 10-level Unity campaign with state machine AI.",
  "project-recallai": "RecallAI maps related YouTube videos into a 3D graph, and nothing leaves your machine.",
  "project-credit-risk": "My credit risk model reaches 0.91 AUC-ROC on synthetic data, with median API responses under 200 ms.",
  "project-nutrisense": "NutriSense recognizes ingredients at 96.41% test accuracy.",
  "project-quickfill": "QuickFill is published on the Chrome Web Store: snippets and autofill on any site.",
  "project-passmanager": "PassManager is a lightweight server for encrypted password storage.",
  "project-ventureview-hr": "VentureViewHR is an AI HR assistant with Gemini-powered insights.",
  "skills-languages": "My languages: Python, Java, TypeScript, Go, C/C++, Swift, SQL and Bash.",
  "skills-distributed-systems-backend": "Backend and distributed systems: Chord DHT, gRPC, Redis, idempotency.",
  "skills-ai-ml": "ML from PyTorch and YOLOv8 to RAG and LLM tool calling.",
  "skills-cloud-infrastructure": "Docker, AWS, Cloudflare Workers and GitHub Actions CI/CD.",
  "skills-mobile-frontend": "SwiftUI and UIKit on mobile, React and Next.js on the web.",
  "skills-engineering-practice": "Pull-request review, feature flags, tests and profiling.",
  "exp-fini": "At Fini I build AI features in SwiftUI and migrate UIKit screens behind feature flags.",
  "exp-stevens-research": "My Stevens research cut federated-learning training energy 35% with under 2% accuracy loss.",
  "exp-djsce-placement-platform": "I owned that placement backend: 10K+ requests a day at under 200 ms p95.",
  "exp-djsce-undergrad-research": "That work became a peer-reviewed paper on ingredient recognition and recipes.",
  "journey-btech": "Where it started: a B.Tech in AI and Machine Learning in Mumbai.",
  "journey-publication": "A peer-reviewed paper I co-authored, in Library Progress International.",
  "journey-hackhouse-sf": "HackHouse SF: Top 100, and I pitched FleetIQ to AirGarage.",
  "journey-quackhacks": "QuackHacks '26: 1st place with a 3D dueling game.",
  "journey-stevens": "The MS in Computer Science at Stevens, class of 2027.",
  "journey-graduation": "MS graduation in May 2027.",
  "journey-full-time": "I can start full-time in June 2027, and I'm open to new-grad software and ML roles now.",
};

/** Quick-jump chips (the menu opened from the robot). `resume` opens the PDF; any other target is a section id. */
export const CHIPS: { id: string; label: string; target: "resume" | (typeof SECTION_IDS)[number] }[] = [
  { id: "resume", label: "Resume", target: "resume" },
  { id: "projects", label: "Projects", target: "projects" },
  { id: "experience", label: "Experience", target: "experience" },
  { id: "skills", label: "Skills", target: "skills" },
  { id: "contact", label: "Contact", target: "contact" },
];
export const RESUME_URL = "/Kunj_Pandya_Resume.pdf";
/** How long a chip's stage request stays valid while the smooth scroll is still on its way. */
export const FORCED_STAGE_TTL_MS = 3000;
