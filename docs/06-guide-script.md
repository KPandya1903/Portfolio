# 06 — Guide script

What the avatar says. First person, as Kunj (D4). One line per section, at most 140 characters; the intro is at most
160; a hover line is at most 120. Every number must already appear in the site's data files; `config.test.ts` fails the build otherwise.

| Stop | Clip after arriving | Points at | Line | Facts come from |
|---|---|---|---|---|
| **intro** | Wave → Talk | — | Hi, I'm Kunj. I'm finishing my MS in CS at Stevens in May 2027, and I build distributed systems and ML that ships. | `metadata.availability` ("MS CS @ Stevens, May 2027"), `metadata.title` |
| `hero` | Point | `[data-guide-target="resume"]` | Want the one-page version? My resume is right here. | — |
| `journey` | Point | `#journey h2` | This is the path so far: Mumbai to Hoboken, research to production. | `metadata.bio[0]` (D.J. Sanghvi, Mumbai), `metadata.location` (Hoboken) |
| `about` | Talk | — | I like building systems from their primitives. Here's a bit more about me. | `metadata.bio[1]` |
| `experience` | Point | `[data-guide-target="experience-list"]` | Right now I build AI features for Fini's iOS app. Before that, a platform serving 10K+ requests a day. | `experience.ts` (Fini, current), `metadata.bio[2]` ("10K+ requests a day") |
| `projects` | Point | `#projects h2` | Click any card. Every public project links straight to its repo. | `projects.ts` (`githubRepo` on every card except Edara, which is private) |
| `linkedin` | — | — | (no line; the section is hidden while empty) | `linkedinPosts.ts` |
| `skills` | Point | `#skills h2` | My toolbox, grouped by what each tool is for. | `skills.ts` categories |
| `contact` | ThumbsUp | `[data-guide-target="contact-links"]` | That's the tour! I'm open to new-grad SWE and ML roles. Say hi. | `metadata.availability` |

A section's line is spoken from the centre stage where the stage plays, otherwise from the corner on arrival; either way
once per page view ([04](04-system-design.md) §4.3).

## Hover lines

Said when the mouse rests 350 ms on an item marked `data-guide-hover`, at most once per 6 s, on wide screens with
motion allowed ([04](04-system-design.md) §4.5). The ids are in `HOVER_LINES` in `config.ts`. An item with no line
(for example the other Journey entries) is looked at silently. `config.test.ts` checks every number against the data
files.

| Hover id | Line | Facts come from |
|---|---|---|
| `project-edara` | Edara is a private repo, so there's no link. Ask Kunj for a walkthrough. | `projects.ts` edara (private repo, no `githubRepo`) |
| `project-nexusmesh` | A Chord DHT built from primitives: under 5 ms p99 lookups in a 100-node network. | `projects.ts` nexusmesh `impact` (<5 ms p99, 100 nodes) |
| `project-taskpulse` | TaskPulse stops retry storms with a Redis priority queue, idempotent execution and bounded backoff. | `projects.ts` taskpulse (Redis priority queue, idempotent execution, bounded backoff; retry storms in `impact`) |
| `project-fleetiq` | FleetIQ reached 98.15% OCR success and produced 591 matched entry-exit pairs. | `projects.ts` fleetiq `impact` (98.15% OCR, 591 matched pairs) |
| `project-doclens` | DocLens runs search and chat on Cloudflare's edge, with about 70 ms cold starts, and it's live. | `projects.ts` doclens `impact` (~70 ms cold start, live in production) |
| `project-vaultchat` | In VaultChat the server only ever stores ciphertext. No plaintext field exists. | `projects.ts` vaultchat (server stores ciphertext only) |
| `project-tradeflow` | TradeFlow is a paper trading platform with real-time pricing and forecasting. | `projects.ts` tradeflow description |
| `project-i-wizard` | I Wizard won 1st place at QuackHacks '26, built in a 24-hour hackathon. | `projects.ts` i-wizard `impact` (1st place QuackHacks '26, 24-hour build) |
| `project-wizard-duel` | Wizard Duel is a 10-level Unity campaign with state machine AI. | `projects.ts` wizard-duel description |
| `project-recallai` | RecallAI maps related YouTube videos into a 3D graph, and nothing leaves your machine. | `projects.ts` recallai description |
| `project-credit-risk` | My credit risk model reaches 0.91 AUC-ROC on synthetic data, with median API responses under 200 ms. | `projects.ts` credit-risk `impact` (0.91 AUC-ROC, <200 ms median) |
| `project-nutrisense` | NutriSense recognizes ingredients at 96.41% test accuracy. | `projects.ts` nutrisense `impact` (96.41% test accuracy; to be confirmed against the repo, see [notes](interactive-guide-notes.md)) |
| `project-quickfill` | QuickFill is published on the Chrome Web Store: snippets and autofill on any site. | `projects.ts` quickfill description |
| `project-passmanager` | PassManager is a lightweight server for encrypted password storage. | `projects.ts` passmanager description |
| `project-ventureview-hr` | VentureViewHR is an AI HR assistant with Gemini-powered insights. | `projects.ts` ventureview-hr description |
| `skills-languages` | My languages: Python, Java, TypeScript, Go, C/C++, Swift, SQL and Bash. | `skills.ts` Languages |
| `skills-distributed-systems-backend` | Backend and distributed systems: Chord DHT, gRPC, Redis, idempotency. | `skills.ts` Distributed Systems & Backend |
| `skills-ai-ml` | ML from PyTorch and YOLOv8 to RAG and LLM tool calling. | `skills.ts` AI / ML |
| `skills-cloud-infrastructure` | Docker, AWS, Cloudflare Workers and GitHub Actions CI/CD. | `skills.ts` Cloud & Infrastructure |
| `skills-mobile-frontend` | SwiftUI and UIKit on mobile, React and Next.js on the web. | `skills.ts` Mobile & Frontend |
| `skills-engineering-practice` | Pull-request review, feature flags, tests and profiling. | `skills.ts` Engineering Practice |
| `exp-fini` | At Fini I build AI features in SwiftUI and migrate UIKit screens behind feature flags. | `experience.ts` fini |
| `exp-stevens-research` | My Stevens research cut federated-learning training energy 35% with under 2% accuracy loss. | `experience.ts` stevens-research (35% energy cut, <2% accuracy loss) |
| `exp-djsce-placement-platform` | I owned that placement backend: 10K+ requests a day at under 200 ms p95. | `experience.ts` djsce-placement-platform (10K+ requests a day, <200 ms p95) |
| `exp-djsce-undergrad-research` | That work became a peer-reviewed paper on ingredient recognition and recipes. | `experience.ts` djsce-undergrad-research (peer-reviewed paper) |
| `journey-btech` | Where it started: a B.Tech in AI and Machine Learning in Mumbai. | `timeline.ts` btech |
| `journey-publication` | A peer-reviewed paper I co-authored, in Library Progress International. | `timeline.ts` publication (Library Progress International) |
| `journey-hackhouse-sf` | HackHouse SF: Top 100, and I pitched FleetIQ to AirGarage. | `timeline.ts` hackhouse-sf (Top 100, pitched AirGarage) |
| `journey-quackhacks` | QuackHacks '26: 1st place with a 3D dueling game. | `timeline.ts` quackhacks (1st place) |
| `journey-stevens` | The MS in Computer Science at Stevens, class of 2027. | `timeline.ts` stevens |
| `journey-graduation` | MS graduation in May 2027. | `timeline.ts` graduation |
| `journey-full-time` | I can start full-time in June 2027, and I'm open to new-grad software and ML roles now. | `timeline.ts` full-time |

## Menu chips

Shown when the robot is clicked (`CHIPS` in `config.ts`). No lines; they are navigation.

| Chip | Action |
|---|---|
| Resume | Opens `/Kunj_Pandya_Resume.pdf` in a new tab |
| Projects | Scrolls to `#projects`; on wide screens with motion allowed, stages it |
| Experience | Scrolls to `#experience`; same |
| Skills | Scrolls to `#skills`; same |
| Contact | Scrolls to `#contact`; same |

## Rules

1. **No new facts.** A line may only restate what the section itself shows. If a number changes in a data file,
   the line changes in the same commit.
2. **Edara stays private** (the live site shows it with a "Private repository" label and no link). The projects
   line says "public project" for that reason.
3. **No claims that need proof the page lacks** ("best", "expert", rankings not shown on the page).
4. **Short.** The bubble is 248 px wide on wide screens (220 px on compact); 140 characters is about four lines.
5. Lines live in `web/src/guide/config.ts` only. These tables are the spec; the config is the source of truth.
6. A hover line that states a number needs the same proof as a stop line. Two are unconfirmed against their repos (NutriSense 96.41%, FleetIQ 591 pairs): see [interactive-guide-notes](interactive-guide-notes.md).
