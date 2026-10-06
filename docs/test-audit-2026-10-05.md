# Test audit, 2026-10-05 (test-driven-development pass)

The first build wrote the five pure modules test-first, but every runtime module after them, and the browser tests,
came after the code. This pass rebuilt them by the TDD rules. Result: 89 unit tests + 7 browser tests, all passing.

## Rebuilt test-first (deleted, failing test watched, then reimplemented)

| Module | Tests | Design change the tests forced |
|---|---|---|
| `guide/highlight.ts` | 4 | — |
| `guide/environment.ts` | 11 | `primeGuideState(store, matches, webgl)`: injected instead of reaching for globals |
| `guide/anchors.ts` (new helpers) | +6 | `worldToPx`, `yawToward`, `bubbleBox` pulled out of the avatar/bubble components |
| `guide/useTypewriter.ts` | 6 | — |
| `guide/store.ts` `useGuide` | 1 | optional `store` parameter |
| `guide/useIntroSequence.ts` | 6 | injected store; dropped a redundant `modelReady` check (the reducer already guards) |
| `guide/useGuideEnvironment.ts` | 3 | injected `matchMedia`; narrow `MediaQuery` interface |
| `guide/useActiveSection.ts` | 5 | injected store |
| `guide/GuideToggle.tsx` | 3 | `store` prop |
| `guide/SpeechBubble.tsx` | 7 | `store` prop |
| `components/sections/yearLabels.ts` | 3 | Journey's minimap label loop extracted from the component |

Not unit-tested, by choice: `GuideAvatar`, `GuideCanvas`, `GuideRoot`, `GuideLoader`. They are R3F/Next glue whose
logic now lives in the tested helpers above; the browser tests cover them.

## Tests that passed against do-nothing stubs, proven by mutation

A guard test can pass against an empty stub; each was then shown to fail against a deliberately broken version.

| Test | Mutant | Caught |
|---|---|---|
| storage "blocked" (×2) | try/catch removed | yes |
| `hasWebGL` false | always true | yes |
| `yawToward` faces forward (×2) | always turns | yes |
| `useTypewriter` starts empty | starts at 1 char | yes |
| `useIntroSequence` keeps intro | timeout always ends intro | yes |
| `useActiveSection` ignores leaving | `isIntersecting` ignored | yes |
| `SpeechBubble` renders nothing / stays up wide / hidden until placed | three mutants | yes |

## Browser tests (written after the code), proven by mutation

| Mutant | Tests that failed |
|---|---|
| `<GuideLoader />` removed | intro, scrolling, reduced motion, guide off |
| rail CSS removed | reserves the rail |
| avatar never calls `arrive` | intro, scrolling, reduced motion |
| `flashHighlight` call removed | scrolling |
| compact avatar centred | phone |
| session "intro seen" flag ignored | **none at first.** The test waited for "done", which a replayed intro also reaches. Fixed to record whether the page ever enters "hello"; now fails against this mutant |

## Test bugs found along the way

- `config.test`: number regex captured the trailing comma in "2027,".
- `environment.test`: the first-visit test started from the state it asserted, so it proved nothing.
- `environment.test`: a `Storage.prototype` spy leaked across tests in happy-dom; switched to the `window.localStorage` getter (also the real failure mode).
- `useIntroSequence.test`: "keeps the intro" advanced 1 ms short of the timeout, so the timer never fired.
- `useActiveSection.test`: a shared `FakeObserver.last` could let one test read another's observer.
- `guide.spec` intro test: see the table above.
