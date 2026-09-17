# Coquí del Yunque

A Puerto Rico-centered, side-scrolling platform adventure. Guide a little coquí from the rainforest to the summit, restore three songs in each route, and carry the island's chorus home.

## Beta candidate: 0.4.0-beta.1

Four playable routes, animated procedural characters, original illustrated environments, persistent powers, checkpoints, and completion tracking are implemented. Automated checks pass; this is **not yet a device-certified release**. See [TESTING.md](TESTING.md) for evidence and remaining release gates.

The existing `progress.md` supplied the project's direction; the repository had no README at the starting revision. This build keeps the coquí, chirping, flowers, powers, and Puerto Rican setting while replacing the prototype's monolithic engine with testable modules. The earlier implementation remains recoverable in Git history.

## Run

Requires Node.js 20 or newer. No package installation or build step is needed.

```sh
npm start
# Open http://localhost:4173
npm run check
npm test
```

Serve the repository over HTTP, not `file://`. A static host must preserve the `src/` and `assets/` paths. No backend, account, analytics, or external runtime libraries are required.

## The four routes

| Route | Setting | Challenge progression | Target first-play duration |
| --- | --- | --- | --- |
| Senderos del Yunque | Sunlit rainforest | Jump timing, enemies, chirping and upper paths | 4–6 minutes |
| Cavernas del Río | Limestone caverns and waterfalls | Moving ledges, thorn barriers, fire and glide | 4–7 minutes |
| Mangle de las Estrellas | Bioluminescent mangroves | Rafts, temporary ice, crumbling paths | 5–7 minutes |
| Coro de la Cumbre | Storm-lit Luquillo summit | Wider gaps, wind, stone barriers and combined skills | 5–8 minutes |

Durations are design targets, not measured human averages. Each route has three required song shrines, three optional relics, coins, checkpoints and optional elevated paths. Chirp near each shrine before entering the finish arch. The pause menu can return you to a missed shrine's approach.

## Controls and powers

- Move: arrows or A/D. Jump: Space, W or up arrow. A fresh airborne press uses flutter when unlocked; hold jump to glide.
- Chirp: C or X. Attack: Z or K. Cycle attack: R. Pause: Escape or P.
- Touch: separate direction, jump, chirp, attack and swap controls; multiple fingers are supported.
- Bubble homes and chains; Flame burns thorns; Frost freezes enemies and forms temporary footholds; Stone breaks rock barriers and spikes. Glide and heart reserve are passive unlocks.

Progress is saved locally on this browser/device. Storage failures do not prevent play, but progress then lasts only for the session. Restart clears the current route's run while retaining permanent powers. Old prototype powers migrate; old world coordinates do not.

## Engineering

`src/game.js` owns simulation, `levels.js` route construction, `render.js` presentation, `input.js` independent keyboard/pointer sources, `save.js` validated persistence, `audio.js` synthesized sound, and `main.js` DOM integration. Physics uses a fixed 120 Hz accumulator independent of display refresh; hidden-tab/focus changes clear input and pause. Rendering culls offscreen objects and caps pixel density. Settings include reduced effects and sound.

Context7's MDN documentation informed the fixed-timestep loop, visibility handling, pointer capture and cancellation behavior: [game-loop anatomy](https://developer.mozilla.org/en-US/docs/Games/Anatomy), [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events), [visibilitychange](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event).

Art direction favors inviting platformer silhouettes with detailed island environments, not borrowed Mario/Sonic characters or assets. See [assets/ART.md](assets/ART.md). No uploaded Pokémon ROM content is used.
