# 06 — Guide script

What the avatar says. First person, as Kunj (D4). One line per section, at most 140 characters; the intro is at most
160. Every number must already appear in the site's data files; `config.test.ts` fails the build otherwise.

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

## Rules

1. **No new facts.** A line may only restate what the section itself shows. If a number changes in a data file,
   the line changes in the same commit.
2. **Edara stays private** (the live site shows it with a "Private repository" label and no link). The projects
   line says "public project" for that reason.
3. **No claims that need proof the page lacks** ("best", "expert", rankings not shown on the page).
4. **Short.** The bubble is 248 px wide in the rail; 140 characters is about four lines.
5. Lines live in `web/src/guide/config.ts` only. This table is the spec; the config is the source of truth.

## Anchor heights (wide mode)

| Stop | `wide.y` (fraction of viewport height, avatar centre) | Why |
|---|---|---|
| hero | 0.58 | Level with the hero buttons |
| journey | 0.55 | Below the section heading as it passes the middle |
| about | 0.60 | — |
| experience | 0.55 | — |
| projects | 0.55 | — |
| skills | 0.55 | — |
| contact | 0.60 | Low, near the links |

These are starting values; tune them in the browser in Task 11 of the plan.
