# Weston's Planet games: how to build one

Weston's Planet lives at **https://airronkennedy.com/weston/**. It is a menu with a **Video Call** tile (`/weston/call/`) and **10 toddler games** for Weston, Airron's son, who turns 2 in February 2027. Each game lives in its own folder and runs inside a shared shell.

```
weston/
  index.html, hub.css, hub.js   ← the menu (reads games/games.js)
  call/                         ← the video call (don't touch unless asked)
  games/
    games.js                    ← registry: 10 entries; set live: true to show a game on the menu
    README.md                   ← this file
    LICENSES.md                 ← every asset + license (add yours)
    sw.js                       ← offline cache (network first)
    shell/shell.js, shell.css   ← window.Toddler: chrome, sounds, speech, rewards, fx
    voice/                      ← Dad's voice: SCRIPT.md (what to record), clips.js (sentence → file), build_script.py, <game>/<clip>.m4a
    _template/                  ← copy this to start a game
    <slug>/index.html, game.js, game.css
```

## Who builds what

| # | Slug | Game | Skill | Owner |
|---|---|---|---|---|
| 1 | `bubble-pop` | Bubble Pop | cause & effect, finger isolation | Airron Bot |
| 2 | `animal-sounds` | Animal Sounds | vocabulary, listening | Airron Bot |
| 3 | `shape-sorter` | Shape Sorter | circle / square / triangle | Airron Bot |
| 4 | `color-match` | Color Match | red / blue / yellow / green | Airron Bot |
| 5 | `counting-ducks` | Counting Ducks | counting 1–3 | Game Bot |
| 6 | `peekaboo` | Peekaboo | object permanence | Game Bot |
| 7 | `big-small` | Big & Small | size comparison | Game Bot |
| 8 | `drum-pad` | Music Pad | rhythm, cause & effect | Bartenbot |
| 9 | `puzzles` | Puzzles | 2–3 piece part/whole | Bartenbot |
| 10 | `body-parts` | Touch Your Nose | body-part words | Bartenbot |

Keep the slugs. You may tweak the `title`, `icon`, and `skill` of **your own** entries in `games.js` if your research changes the game.

## Steps to add a game

1. **Research first.** Before you write code, read real sources about why this activity fits a 2-year-old: the [CDC 2-year milestones](https://www.cdc.gov/act-early/milestones/2-years.html), [AAP *Media and Young Minds*](https://publications.aap.org/pediatrics/article/138/5/e20162591/60503/Media-and-Young-Minds), Zero to Three, HealthyChildren.org, and peer-reviewed studies on PubMed or journal pages. **Only cite pages you actually opened. Never invent a source, quote, or statistic.** Let the research change the design (number of choices, which words, round length).
2. `cp -r weston/games/_template weston/games/<slug>` and edit `index.html` (title), `game.js`, `game.css`.
3. **Don't put parent notes on the page.** Airron asked for the "Why this game" text and research links to be taken off the game pages. Write your 3-sentence reasoning (in Airron's voice) and your sources in your PR description instead, and add them to `/workspace/weston-why-and-sources.md` on the box.
4. Set `live: true` on your entry in `games/games.js`.
5. Add any new asset to `LICENSES.md`.
6. Test (see checklist), open a PR on `airronkennedy/airronkennedy.github.io`, merge with a merge commit (**never force-push, never rewrite history**). GitHub Pages deploys `main` in about 1 minute. Live URL: `https://airronkennedy.com/weston/games/<slug>/`.
7. Only commit files under `weston/`. Don't commit stray files (`__pycache__`, PDFs, lockfiles).

## Make it a REAL game (Airron asked for this)

Airron wants these to feel like real, polished games, **as elaborate as you like**: extremely interactive and fun, with **lots of sounds, buttons, animation, and rewards**. Plain "tap a box, see a check mark" is not enough. Aim for:

- **Something happens on every touch.** Every tap anywhere gets a sound and a little animation, even "wrong" taps (a giggle, a wobble, a sparkle). Touching the screen should always be rewarding.
- **Characters with personality.** Faces that blink, look at the finger, bounce, giggle, dance. Idle animation so the screen is alive even when nobody touches it.
- **Juicy feedback.** Squash-and-stretch, bursts (`T.burst`), big emoji pop-ins (`T.bigWord`), screen confetti (`T.party`), layered sounds (`T.sfx.*`, `T.tone`, `T.sfx.note`).
- **Rewards and progression.** Earn stars into the jar (`T.reward(el)`; every 5th fills the jar and throws a party). Vary scenes between rounds (new background, new characters, new music notes) so round 6 feels different from round 1.
- **Talk to him.** Spoken prompts and labels with `T.say()`: name the thing he touched ("Red! A red apple!"), praise the effort (`T.praise()`).
- **Bonus moments.** Surprises like a rocket flying past, a "dance party" after a jar fills, a secret extra animal. Keep them short.

…all while keeping every toddler rule below. Rich, not chaotic: one clear thing to do at a time, calm colors, no flashing. AAP guidance warns against fast-paced apps with lots of distracting content for this age.

## Toddler rules (all games, no exceptions)

- **Touch-first for iPad.** Tap targets **≥ 120 px** (use `.tg-target`). Prefer simple taps and big, forgiving drags. No pinch, double-tap, or long-press for the child. Research shows toddlers find tapping and swiping easiest, while pinch and rotate are hardest.
- **No reading required.** Everything is pictures, sound, and voice. Text is only for grown-ups.
- **No fail states, no timers, no lives, no scores that go down.** A wrong choice gets a gentle `T.sfx.soft()` and a wiggle on the right answer, then he tries again. Use `T.idle(fn, ms)` for gentle hints when nobody touches (it's a nudge, not a countdown).
- **Short rounds.** About 3–6 actions, then a celebration and a new round.
- **No ads, no links out, no purchases, no sign-in, no data collection.** Don't add analytics to game pages. `localStorage` for mute and the like is fine.
- **Grown-up exit only.** The shell's 🏠 button needs a **2-second press-and-hold**. Don't add other ways to leave the page.
- **Mute toggle.** It's in the shell, so always route sound through `T.tone` / `T.sfx` / `T.say` so it respects mute.
- **Landscape + portrait.** Lay out with `vw`/`vh`/`vmin`, and re-layout on `resize`. Keep the top 100 px clear for the shell buttons and star jar.
- **Light and offline-ish.** No frameworks, CDNs, web fonts, or big files. Vanilla JS/CSS only. The shell registers a service worker that caches pages after the first visit.
- **Respect reduced motion** (`T.reduceMotion`): fewer particles, no big shaking.
- **Assets:** only original (drawn in code / synthesized), device-rendered emoji, or CC0/commercially licensed files recorded in `LICENSES.md`.

## Shell API (`window.Toddler`, alias `T`)

```js
T.init({ title, icon, color, jarIcon, intro, start })  // builds start screen + chrome; start() runs after Play
T.stage                         // <main id="stage">, full-screen, position:fixed — put your game here
T.say(text, {rate, pitch})      // speak: Dad's recorded clip per sentence if it exists (voice/clips.js), else device voice; returns a Promise
T.praise(extra?)                // "Great job!" etc.
T.sfx.pop(k) .tap() .chime() .sparkle() .boing() .whoosh() .soft() .fanfare() .note(i) .drum() .snap()
T.tone(freq, dur, {type, vol, slide, at})   T.noise(dur, {freq, filter, q, vol})   T.NOTES
T.burst(x, y, {n, emoji:[...], colors:[...], spread, size})   // particle burst at a point
T.party({emoji})                // confetti rain + fanfare
T.bigWord('🎉')                 // big emoji pops in the middle
T.reward(el)                    // star flies from el into the jar; every 5th = party. Returns true when the jar fills
T.onTap(el, fn)                 // fires on pointerdown (fast, multi-touch)
T.drag(el, {start, move, end})  // pointer-captured drag; args (clientX, clientY, offsetX, offsetY)
T.idle(fn, ms)                  // gentle hint when untouched for ms
T.wiggle(el) T.bounce(el) T.center(el) T.rand(a,b) T.pick(arr) T.shuffle(arr) T.wait(ms) T.el(tag, cls, html)
T.reduceMotion                  // boolean
```

Sounds and speech only start after the child taps the big ▶ Play button. That's an iOS rule, and the shell handles it.

## Test checklist before merging

- [ ] Open locally (`python3 -m http.server` from the repo root, then go to `/weston/games/<slug>/`) and check it in an iPad-size viewport in **both orientations** (1024×768 and 768×1024) plus a phone size.
- [ ] No console errors. Nothing loads from another domain.
- [ ] Every target is ≥ 120 px. There's no way to fail or lose, and every touch does something.
- [ ] 🏠 only exits after a 2 s hold. 🔇 silences everything, including speech.
- [ ] The PR description has the 3-sentence why and real sources you read. No why/research text on the page.
- [ ] New spoken lines are added to `voice/build_script.py`, and you re-ran it (it updates `voice/SCRIPT.md` + `voice/clips.js`).
- [ ] `games.js` has `live: true`, and the hub tile opens the game.
