# Beta verification

## Verified in the development environment

- `npm run check`: source syntax and all four required background assets.
- `npm test`: 27 passing tests covering jump edges/buffering/coyote time, 30/60/120 Hz equivalence, independent input sources, moving-platform carry, ceilings, fall recovery, denied/malformed storage, checkpoint restoration, power migration and selection, attack interactions, completion, pause/restart, checkpoint safety, shrine approaches and route traversal.
- All four scenes rendered through native Canvas and visually inspected at 1280 × 720. This verifies drawing and asset loading, not browser layout, touch, or browser frame rate.

The route traversal bot is a geometry regression check: it starts with powers unlocked and songs already awakened. Shrine tests separately place the player at the shrine approach. Neither is evidence of a complete natural player campaign or measured average completion time.

## Required before calling this a release-ready beta

Browser preview was explicitly blocked by the execution environment. No alternative browser was used to bypass that restriction. These checks remain open:

1. Fresh-save playthrough of all four routes without test hooks, naturally collecting powers and awakening all shrines. Record first-play times and deaths; tune against the README duration targets.
2. Desktop Chrome, Firefox and Safari: title/menu keyboard navigation, dialogs, sound unlock, pause/resume, reload and completion persistence.
3. iOS Safari and Android Chrome in portrait and landscape: movement plus jump plus attack, cancelled pointers, rotation, backgrounding and safe-area layout. Confirm controls do not cover essential landings.
4. Real low/mid-range phone profiling: frame pacing, long frames, memory and loading on a throttled connection. Compare reduced-effects mode. Four PNG environments total roughly 10 MB; optimize delivery if measurements warrant it.
5. Check all optional relic routes, missed-shrine recovery, temporary ice, wind and moving platforms with each relevant power.
6. Check reduced motion, muted audio, storage disabled and a clean console. Verify foreground/background contrast across the entire route, not just sampled scenes.

Do not merge or label these items passed solely on the automated test results.

## Diagnostics

`window.render_game_to_text()` exposes a read-only state summary. Mutable hooks exist only with `?test=1` on `localhost` or `127.0.0.1`. Do not use hooks for acceptance playthroughs.
