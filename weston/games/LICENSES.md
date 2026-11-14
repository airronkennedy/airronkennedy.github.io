# Weston's Planet games: credits & licenses

Every game under `/weston/games/` must only use assets listed here. Add a row before you ship anything new.

| Asset | Where | Source | License |
|---|---|---|---|
| All game code, CSS, layouts | `/weston/games/**` | Original, written for this site | © Airron Kennedy, all rights reserved |
| Sound effects (pops, chimes, boings, drums, notes, fanfares) | `shell/shell.js` | Synthesized live in the browser with the Web Audio API; no audio files | Original (generated) |
| Spoken words and prompts | `shell/shell.js` (`Toddler.say`) | The device's own built-in text-to-speech voice (Web Speech API); no recordings are shipped | Rendered on the device, nothing redistributed |
| Emoji pictures (animals, shapes, icons) | game pages, hub tiles | Typed Unicode characters drawn by the device's system emoji font (Apple Color Emoji on iPad); no emoji images are shipped | Rendered by the OS font, nothing redistributed |
| Shapes, bubbles, characters drawn with CSS / SVG / canvas | game folders | Original, drawn in code | © Airron Kennedy |
| Extra drum, shaker, bell, block, crash and toot voices | `/weston/games/drum-pad/game.js` | Synthesized live with the Web Audio API through `Toddler.tone` and `Toddler.noise` (same mute path as the shell); no audio files | Original (generated) |
| Pond, ducks, reeds, water, and lily pads drawn in CSS; quacks and splashes synthesized in game.js | `/weston/games/counting-ducks/` | Original, drawn and synthesized in code with the shared `Toddler` Web Audio helpers (mute-safe); no image or audio files | © Airron Kennedy |
| Friends (teddy, puppy, kitty, bunny, duckling), covers (blanket, leaf, box, cushion, hands), and rooms drawn in CSS | `/weston/games/peekaboo/` | Original, drawn in code; giggles and reveals use the shared `Toddler` Web Audio helpers (mute-safe); no image or audio files | © Airron Kennedy |
| Big and little characters (duck, bear, cup, truck, apple, elephant, ball) and scene backdrops drawn in CSS | `/weston/games/big-small/` | Original, drawn in code; boops and cheers use the shared `Toddler` Web Audio helpers (mute-safe); no image or audio files | © Airron Kennedy |
| Puzzle pictures, clipped piece art, and sticker-book frames drawn in CSS | `/weston/games/puzzles/` | Original, drawn in code; snaps and cheers use the shared `Toddler` Web Audio helpers (mute-safe); no image or audio files | © Airron Kennedy |
| Friend characters (kid, bear, robot), hats, and body-part targets drawn in CSS; song tones synthesized in game.js | `/weston/games/body-parts/` | Original, drawn and synthesized in code with the shared `Toddler` Web Audio helpers (mute-safe); spoken prompts use the device voice; no image or audio files, and no recorded performance of a copyrighted song | © Airron Kennedy |

Rules for adding assets:

- Prefer drawing in code (CSS/SVG/canvas) and synthesizing sounds. That needs no license.
- Any image/sound file must be CC0 / public domain or a license that allows commercial use without attribution conflicts. Record the exact source URL and license here.
- No assets ripped from apps, TV shows, or characters (no Bluey, Cocomelon, Disney, etc.).
- No fonts or libraries loaded from other sites (CDNs, Google Fonts). Everything must be in this repo.
