# Weston's games: Dad's voice recording script

Record each line below in your own voice and save it at `weston/games/voice/<Clip file>`. For example, `bubble-pop/pop-01.m4a` goes in `weston/games/voice/bubble-pop/pop-01.m4a`.
Drop the files in **one at a time, in any order**. Any line that has a recording plays your voice. Lines you haven't recorded yet still use the device voice.

- **490 lines** in total, each listed once. If two games say the exact same sentence, it appears under the first game only, and one clip covers both.
- **Format:** `.m4a` (iPhone Voice Memos/AAC). Speak close to the mic in a quiet room. Leave about ½ second of silence at the start and end. Keep it short, warm, and a bit slower than normal talking, like you're talking to Weston.
- **Sentence clips:** the games build longer lines from these sentences. For example, "Yes!" + "The cow!" + "Moooo!" plays as three clips back to back, so record each sentence by itself with its own punctuation and energy.
- **How it works:** `voice/clips.js` maps each sentence to its file. The shell tries your file first and falls back to the device voice if the file isn't there yet. After you add or change spoken lines in a game, re-run `python3 weston/games/voice/build_script.py` to rebuild this script and `clips.js`.

## Shared (every game)

**praise**: _big, warm, proud (these play after every win, in all games)_

| Clip file | Say this |
|---|---|
| `shell/praise-01.m4a` | Yay! |
| `shell/praise-02.m4a` | Great job! |
| `shell/praise-03.m4a` | You did it! |
| `shell/praise-04.m4a` | Wow! |
| `shell/praise-05.m4a` | Hooray! |
| `shell/praise-06.m4a` | Nice! |
| `shell/praise-07.m4a` | So good! |
| `shell/praise-08.m4a` | Way to go! |

**jar**: _excited, a little sing-song_

| Clip file | Say this |
|---|---|
| `shell/jar-01.m4a` | You filled up all the stars! |

## 1 · Bubble Pop

**prompt**: _cheerful invitation_

| Clip file | Say this |
|---|---|
| `bubble-pop/prompt-01.m4a` | Pop the bubbles! |

**pop**: _quick and playful, a little high_

| Clip file | Say this |
|---|---|
| `bubble-pop/pop-01.m4a` | Pop! |
| `bubble-pop/pop-02.m4a` | Pop pop! |

**friend**: _surprised and delighted, naming what popped out_

| Clip file | Say this |
|---|---|
| `bubble-pop/friend-01.m4a` | A fish! |
| `bubble-pop/friend-02.m4a` | A duck! |
| `bubble-pop/friend-03.m4a` | A star! |
| `bubble-pop/friend-04.m4a` | A frog! |
| `bubble-pop/friend-05.m4a` | A puppy! |
| `bubble-pop/friend-06.m4a` | An apple! |
| `bubble-pop/friend-07.m4a` | A car! |
| `bubble-pop/friend-08.m4a` | A kitty! |
| `bubble-pop/friend-09.m4a` | A bee! |
| `bubble-pop/friend-10.m4a` | A balloon! |

**gold**: _amazed_

| Clip file | Say this |
|---|---|
| `bubble-pop/gold-01.m4a` | A golden bubble! |

**scene**: _storyteller, "look where we are!"_

| Clip file | Say this |
|---|---|
| `bubble-pop/scene-01.m4a` | Bubbles in the sea! |
| `bubble-pop/scene-02.m4a` | Bubbles in the sky! |
| `bubble-pop/scene-03.m4a` | Bubbles in space! |

## 2 · Animal Sounds

**intro**: _warm, inviting_

| Clip file | Say this |
|---|---|
| `animal-sounds/intro-01.m4a` | Let's meet the animals! |
| `animal-sounds/intro-02.m4a` | Animal dance party! |
| `animal-sounds/intro-03.m4a` | The sun! |

**sound**: _do your best animal voice, have fun with it_

| Clip file | Say this |
|---|---|
| `animal-sounds/sound-01.m4a` | Moooo! |
| `animal-sounds/sound-02.m4a` | Baaa! |
| `animal-sounds/sound-03.m4a` | Oink oink! |
| `animal-sounds/sound-04.m4a` | Quack quack! |
| `animal-sounds/sound-05.m4a` | Woof woof! |
| `animal-sounds/sound-06.m4a` | Meow! |
| `animal-sounds/sound-07.m4a` | Neigh! |
| `animal-sounds/sound-08.m4a` | Cluck cluck! |

**meet**: _clear and slow, introducing a friend_

| Clip file | Say this |
|---|---|
| `animal-sounds/meet-01.m4a` | This is the cow. |
| `animal-sounds/meet-02.m4a` | This is the sheep. |
| `animal-sounds/meet-03.m4a` | This is the pig. |
| `animal-sounds/meet-04.m4a` | This is the duck. |
| `animal-sounds/meet-05.m4a` | This is the dog. |
| `animal-sounds/meet-06.m4a` | This is the cat. |
| `animal-sounds/meet-07.m4a` | This is the horse. |
| `animal-sounds/meet-08.m4a` | This is the chicken. |
| `animal-sounds/meet-09.m4a` | The cow says Moooo! |
| `animal-sounds/meet-10.m4a` | The sheep says Baaa! |
| `animal-sounds/meet-11.m4a` | The pig says Oink oink! |
| `animal-sounds/meet-12.m4a` | The duck says Quack quack! |
| `animal-sounds/meet-13.m4a` | The dog says Woof woof! |
| `animal-sounds/meet-14.m4a` | The cat says Meow! |
| `animal-sounds/meet-15.m4a` | The horse says Neigh! |
| `animal-sounds/meet-16.m4a` | The chicken says Cluck cluck! |

**ask**: _curious question, clear animal word_

| Clip file | Say this |
|---|---|
| `animal-sounds/ask-01.m4a` | Who says Moooo! |
| `animal-sounds/ask-02.m4a` | Who says Baaa! |
| `animal-sounds/ask-03.m4a` | Who says Oink oink! |
| `animal-sounds/ask-04.m4a` | Who says Quack quack! |
| `animal-sounds/ask-05.m4a` | Who says Woof woof! |
| `animal-sounds/ask-06.m4a` | Who says Meow! |
| `animal-sounds/ask-07.m4a` | Who says Neigh! |
| `animal-sounds/ask-08.m4a` | Who says Cluck cluck! |
| `animal-sounds/ask-09.m4a` | Find the cow! |
| `animal-sounds/ask-10.m4a` | Find the sheep! |
| `animal-sounds/ask-11.m4a` | Find the pig! |
| `animal-sounds/ask-12.m4a` | Find the duck! |
| `animal-sounds/ask-13.m4a` | Find the dog! |
| `animal-sounds/ask-14.m4a` | Find the cat! |
| `animal-sounds/ask-15.m4a` | Find the horse! |
| `animal-sounds/ask-16.m4a` | Find the chicken! |
| `animal-sounds/ask-17.m4a` | Where is the cow? |
| `animal-sounds/ask-18.m4a` | Where is the sheep? |
| `animal-sounds/ask-19.m4a` | Where is the pig? |
| `animal-sounds/ask-20.m4a` | Where is the duck? |
| `animal-sounds/ask-21.m4a` | Where is the dog? |
| `animal-sounds/ask-22.m4a` | Where is the cat? |
| `animal-sounds/ask-23.m4a` | Where is the horse? |
| `animal-sounds/ask-24.m4a` | Where is the chicken? |

**yes**: _proud, name the animal clearly_

| Clip file | Say this |
|---|---|
| `animal-sounds/yes-01.m4a` | Yes! |
| `animal-sounds/yes-02.m4a` | The cow! |
| `animal-sounds/yes-03.m4a` | The sheep! |
| `animal-sounds/yes-04.m4a` | The pig! |
| `animal-sounds/yes-05.m4a` | The duck! |
| `animal-sounds/yes-06.m4a` | The dog! |
| `animal-sounds/yes-07.m4a` | The cat! |
| `animal-sounds/yes-08.m4a` | The horse! |
| `animal-sounds/yes-09.m4a` | The chicken! |

**other**: _friendly "oh, that one is…", never disappointed_

| Clip file | Say this |
|---|---|
| `animal-sounds/other-01.m4a` | That's the cow! |
| `animal-sounds/other-02.m4a` | That's the sheep! |
| `animal-sounds/other-03.m4a` | That's the pig! |
| `animal-sounds/other-04.m4a` | That's the duck! |
| `animal-sounds/other-05.m4a` | That's the dog! |
| `animal-sounds/other-06.m4a` | That's the cat! |
| `animal-sounds/other-07.m4a` | That's the horse! |
| `animal-sounds/other-08.m4a` | That's the chicken! |

## 3 · Shape Sorter

**intro**: _cheerful invitation_

| Clip file | Say this |
|---|---|
| `shape-sorter/intro-01.m4a` | Put the shapes in the box! |
| `shape-sorter/intro-02.m4a` | You sorted all the shapes! |
| `shape-sorter/intro-03.m4a` | Circle, square, triangle! |

**name**: _clear, a little emphasis on the shape word_

| Clip file | Say this |
|---|---|
| `shape-sorter/name-01.m4a` | circle |
| `shape-sorter/name-02.m4a` | square |
| `shape-sorter/name-03.m4a` | triangle |
| `shape-sorter/name-04.m4a` | A circle! |
| `shape-sorter/name-05.m4a` | A square! |
| `shape-sorter/name-06.m4a` | A triangle! |

**fit**: _happy "plunk!"_

| Clip file | Say this |
|---|---|
| `shape-sorter/fit-01.m4a` | It fits! |
| `shape-sorter/fit-02.m4a` | Plunk! |
| `shape-sorter/fit-03.m4a` | The circle goes in the circle! |
| `shape-sorter/fit-04.m4a` | The square goes in the square! |
| `shape-sorter/fit-05.m4a` | The triangle goes in the triangle! |

**hint**: _gentle, curious, no disappointment_

| Clip file | Say this |
|---|---|
| `shape-sorter/hint-01.m4a` | That's a circle hole. |
| `shape-sorter/hint-02.m4a` | That's a square hole. |
| `shape-sorter/hint-03.m4a` | That's a triangle hole. |
| `shape-sorter/hint-04.m4a` | Where does the circle go? |
| `shape-sorter/hint-05.m4a` | Where does the square go? |
| `shape-sorter/hint-06.m4a` | Where does the triangle go? |

## 4 · Color Match

**intro**: _cheerful_

| Clip file | Say this |
|---|---|
| `color-match/intro-01.m4a` | Let's paint! |
| `color-match/intro-02.m4a` | Paint party! |
| `color-match/intro-03.m4a` | Red, blue, yellow, green! |

**color**: _clear color word, bright and happy_

| Clip file | Say this |
|---|---|
| `color-match/color-01.m4a` | red |
| `color-match/color-02.m4a` | blue |
| `color-match/color-03.m4a` | yellow |
| `color-match/color-04.m4a` | green |

**ask**: _inviting, emphasize the color_

| Clip file | Say this |
|---|---|
| `color-match/ask-01.m4a` | Let's paint the apple red! |
| `color-match/ask-02.m4a` | Let's paint the car red! |
| `color-match/ask-03.m4a` | Let's paint the fish blue! |
| `color-match/ask-04.m4a` | Let's paint the ball blue! |
| `color-match/ask-05.m4a` | Let's paint the sun yellow! |
| `color-match/ask-06.m4a` | Let's paint the duck yellow! |
| `color-match/ask-07.m4a` | Let's paint the leaf green! |
| `color-match/ask-08.m4a` | Let's paint the frog green! |
| `color-match/ask-09.m4a` | Find red! |
| `color-match/ask-10.m4a` | Find blue! |
| `color-match/ask-11.m4a` | Find yellow! |
| `color-match/ask-12.m4a` | Find green! |
| `color-match/ask-13.m4a` | Can you find red? |
| `color-match/ask-14.m4a` | Can you find blue? |
| `color-match/ask-15.m4a` | Can you find yellow? |
| `color-match/ask-16.m4a` | Can you find green? |

**done**: _proud, name color + thing_

| Clip file | Say this |
|---|---|
| `color-match/done-01.m4a` | A red apple! |
| `color-match/done-02.m4a` | A red car! |
| `color-match/done-03.m4a` | A blue fish! |
| `color-match/done-04.m4a` | A blue ball! |
| `color-match/done-05.m4a` | A yellow sun! |
| `color-match/done-06.m4a` | A yellow duck! |
| `color-match/done-07.m4a` | A green leaf! |
| `color-match/done-08.m4a` | A green frog! |
| `color-match/done-09.m4a` | apple! |
| `color-match/done-10.m4a` | car! |
| `color-match/done-11.m4a` | fish! |
| `color-match/done-12.m4a` | ball! |
| `color-match/done-13.m4a` | sun! |
| `color-match/done-14.m4a` | duck! |
| `color-match/done-15.m4a` | leaf! |
| `color-match/done-16.m4a` | frog! |

**other**: _friendly "oh, that one is…"_

| Clip file | Say this |
|---|---|
| `color-match/other-01.m4a` | That's red! |
| `color-match/other-02.m4a` | That's blue! |
| `color-match/other-03.m4a` | That's yellow! |
| `color-match/other-04.m4a` | That's green! |

## 5 · Counting Ducks

**intro**: _cheerful_

| Clip file | Say this |
|---|---|
| `counting-ducks/intro-01.m4a` | Let's count ducks! |
| `counting-ducks/intro-02.m4a` | Can you tap the ducks? |
| `counting-ducks/intro-03.m4a` | Tap the ducks! |

**count**: _slow, clear counting voice, one number per tap_

| Clip file | Say this |
|---|---|
| `counting-ducks/count-01.m4a` | One |
| `counting-ducks/count-02.m4a` | Two |
| `counting-ducks/count-03.m4a` | Three |
| `counting-ducks/count-04.m4a` | 1 |
| `counting-ducks/count-05.m4a` | 2 |
| `counting-ducks/count-06.m4a` | 3 |

**total**: _proud, "we counted them!"_

| Clip file | Say this |
|---|---|
| `counting-ducks/total-01.m4a` | One duck! |
| `counting-ducks/total-02.m4a` | Two ducks! |
| `counting-ducks/total-03.m4a` | Three ducks! |

## 6 · Peekaboo

**intro**: _playful, a little mysterious_

| Clip file | Say this |
|---|---|
| `peekaboo/intro-01.m4a` | Peekaboo! |
| `peekaboo/intro-02.m4a` | Let's find our friends! |
| `peekaboo/intro-03.m4a` | Not here… |

**name**: _happy greeting_

| Clip file | Say this |
|---|---|
| `peekaboo/name-01.m4a` | Teddy! |
| `peekaboo/name-02.m4a` | Puppy! |
| `peekaboo/name-03.m4a` | Kitty! |
| `peekaboo/name-04.m4a` | Bunny! |
| `peekaboo/name-05.m4a` | It's Teddy! |
| `peekaboo/name-06.m4a` | It's Puppy! |
| `peekaboo/name-07.m4a` | It's Kitty! |
| `peekaboo/name-08.m4a` | It's Bunny! |
| `peekaboo/name-09.m4a` | It's Duck! |

**where**: _whispery, curious_

| Clip file | Say this |
|---|---|
| `peekaboo/where-01.m4a` | Where's Teddy? |
| `peekaboo/where-02.m4a` | Where's Puppy? |
| `peekaboo/where-03.m4a` | Where's Kitty? |
| `peekaboo/where-04.m4a` | Where's Bunny? |
| `peekaboo/where-05.m4a` | Where's Duck? |
| `peekaboo/where-06.m4a` | Under the blanket! |
| `peekaboo/where-07.m4a` | Under the leaf! |
| `peekaboo/where-08.m4a` | Under the box! |
| `peekaboo/where-09.m4a` | Under the cushion! |
| `peekaboo/where-10.m4a` | Under the hands! |

**found**: _big "peekaboo!" reveal_

| Clip file | Say this |
|---|---|
| `peekaboo/found-01.m4a` | There's Teddy! |
| `peekaboo/found-02.m4a` | There's Puppy! |
| `peekaboo/found-03.m4a` | There's Kitty! |
| `peekaboo/found-04.m4a` | There's Bunny! |
| `peekaboo/found-05.m4a` | There's Duck! |
| `peekaboo/found-06.m4a` | You found Teddy! |
| `peekaboo/found-07.m4a` | You found Puppy! |
| `peekaboo/found-08.m4a` | You found Kitty! |
| `peekaboo/found-09.m4a` | You found Bunny! |
| `peekaboo/found-10.m4a` | You found Duck! |

**hide**: _sing-song, "go hide!"_

| Clip file | Say this |
|---|---|
| `peekaboo/hide-01.m4a` | Hide, Teddy! |
| `peekaboo/hide-02.m4a` | Hide, Puppy! |
| `peekaboo/hide-03.m4a` | Hide, Kitty! |
| `peekaboo/hide-04.m4a` | Hide, Bunny! |
| `peekaboo/hide-05.m4a` | Hide, Duck! |

## 7 · Big & Small

**intro**: _cheerful_

| Clip file | Say this |
|---|---|
| `big-small/intro-01.m4a` | Let's find the big one and the little one! |
| `big-small/intro-02.m4a` | Look! |

**show**: _BIG voice for big, tiny voice for little_

| Clip file | Say this |
|---|---|
| `big-small/show-01.m4a` | A big duck and a little duck. |
| `big-small/show-02.m4a` | A big bear and a little bear. |
| `big-small/show-03.m4a` | A big cup and a little cup. |
| `big-small/show-04.m4a` | A big truck and a little truck. |
| `big-small/show-05.m4a` | A big apple and a little apple. |
| `big-small/show-06.m4a` | A big elephant and a little elephant. |
| `big-small/show-07.m4a` | A big ball and a little ball. |

**ask**: _BIG voice for big, tiny voice for little_

| Clip file | Say this |
|---|---|
| `big-small/ask-01.m4a` | Where is the big duck? |
| `big-small/ask-02.m4a` | Where is the little duck? |
| `big-small/ask-03.m4a` | Where is the big bear? |
| `big-small/ask-04.m4a` | Where is the little bear? |
| `big-small/ask-05.m4a` | Where is the big cup? |
| `big-small/ask-06.m4a` | Where is the little cup? |
| `big-small/ask-07.m4a` | Where is the big truck? |
| `big-small/ask-08.m4a` | Where is the little truck? |
| `big-small/ask-09.m4a` | Where is the big apple? |
| `big-small/ask-10.m4a` | Where is the little apple? |
| `big-small/ask-11.m4a` | Where is the big elephant? |
| `big-small/ask-12.m4a` | Where is the little elephant? |
| `big-small/ask-13.m4a` | Where is the big ball? |
| `big-small/ask-14.m4a` | Where is the little ball? |

**yes**: _proud; BIG or tiny voice to match_

| Clip file | Say this |
|---|---|
| `big-small/yes-01.m4a` | That is the big duck! |
| `big-small/yes-02.m4a` | That is the little duck! |
| `big-small/yes-03.m4a` | That is the big bear! |
| `big-small/yes-04.m4a` | That is the little bear! |
| `big-small/yes-05.m4a` | That is the big cup! |
| `big-small/yes-06.m4a` | That is the little cup! |
| `big-small/yes-07.m4a` | That is the big truck! |
| `big-small/yes-08.m4a` | That is the little truck! |
| `big-small/yes-09.m4a` | That is the big apple! |
| `big-small/yes-10.m4a` | That is the little apple! |
| `big-small/yes-11.m4a` | That is the big elephant! |
| `big-small/yes-12.m4a` | That is the little elephant! |
| `big-small/yes-13.m4a` | That is the big ball! |
| `big-small/yes-14.m4a` | That is the little ball! |

**other**: _friendly, never disappointed_

| Clip file | Say this |
|---|---|
| `big-small/other-01.m4a` | That's the big duck! |
| `big-small/other-02.m4a` | That's the little duck! |
| `big-small/other-03.m4a` | That's the big bear! |
| `big-small/other-04.m4a` | That's the little bear! |
| `big-small/other-05.m4a` | That's the big cup! |
| `big-small/other-06.m4a` | That's the little cup! |
| `big-small/other-07.m4a` | That's the big truck! |
| `big-small/other-08.m4a` | That's the little truck! |
| `big-small/other-09.m4a` | That's the big apple! |
| `big-small/other-10.m4a` | That's the little apple! |
| `big-small/other-11.m4a` | That's the big elephant! |
| `big-small/other-12.m4a` | That's the little elephant! |
| `big-small/other-13.m4a` | That's the big ball! |
| `big-small/other-14.m4a` | That's the little ball! |
| `big-small/other-15.m4a` | This one is big. |
| `big-small/other-16.m4a` | This one is little. |

## 8 · Music Pad

**intro**: _upbeat, musical_

| Clip file | Say this |
|---|---|
| `drum-pad/intro-01.m4a` | Tap a drum! |
| `drum-pad/intro-02.m4a` | Your turn! |
| `drum-pad/intro-03.m4a` | Go! |
| `drum-pad/intro-04.m4a` | Tap go! |
| `drum-pad/intro-05.m4a` | Stop! |
| `drum-pad/intro-06.m4a` | Freeze! |
| `drum-pad/intro-07.m4a` | You played too! |

**hit**: _snappy, name the instrument_

| Clip file | Say this |
|---|---|
| `drum-pad/hit-01.m4a` | Drum! |
| `drum-pad/hit-02.m4a` | Shaker! |
| `drum-pad/hit-03.m4a` | Bell! |
| `drum-pad/hit-04.m4a` | Block! |
| `drum-pad/hit-05.m4a` | Crash! |
| `drum-pad/hit-06.m4a` | Toot! |
| `drum-pad/hit-07.m4a` | Tap the drum! |
| `drum-pad/hit-08.m4a` | Tap the shaker! |
| `drum-pad/hit-09.m4a` | Tap the bell! |
| `drum-pad/hit-10.m4a` | Tap the block! |
| `drum-pad/hit-11.m4a` | Tap the crash! |
| `drum-pad/hit-12.m4a` | Tap the toot! |

**mode**: _announcer, fun_

| Clip file | Say this |
|---|---|
| `drum-pad/mode-01.m4a` | Drums! |
| `drum-pad/mode-02.m4a` | Tap to play. |
| `drum-pad/mode-03.m4a` | Copy me! |
| `drum-pad/mode-04.m4a` | You can play along. |
| `drum-pad/mode-05.m4a` | Parade! |
| `drum-pad/mode-06.m4a` | Tap go, then stop. |
| `drum-pad/mode-07.m4a` | Band time! |
| `drum-pad/mode-08.m4a` | Play with friends. |

**friend**: _surprised and happy_

| Clip file | Say this |
|---|---|
| `drum-pad/friend-01.m4a` | A new friend! |
| `drum-pad/friend-02.m4a` | A fox! |
| `drum-pad/friend-03.m4a` | A bird! |
| `drum-pad/friend-04.m4a` | A bear! |

## 9 · Puzzles

**intro**: _calm, encouraging_

| Clip file | Say this |
|---|---|
| `puzzles/intro-01.m4a` | Put the big pieces together. |
| `puzzles/intro-02.m4a` | Two pieces first, then three. |
| `puzzles/intro-03.m4a` | You can drag or tap. |
| `puzzles/intro-04.m4a` | Finish a puzzle to earn a sticker! |
| `puzzles/intro-05.m4a` | Your stickers! |

**ask**: _inviting_

| Clip file | Say this |
|---|---|
| `puzzles/ask-01.m4a` | Can you put the dog together? |
| `puzzles/ask-02.m4a` | Can you put the cat together? |
| `puzzles/ask-03.m4a` | Can you put the duck together? |
| `puzzles/ask-04.m4a` | Can you put the fish together? |
| `puzzles/ask-05.m4a` | Can you put the car together? |
| `puzzles/ask-06.m4a` | Can you put the bus together? |
| `puzzles/ask-07.m4a` | Can you put the truck together? |
| `puzzles/ask-08.m4a` | Can you put the train together? |
| `puzzles/ask-09.m4a` | Can you put the circle together? |
| `puzzles/ask-10.m4a` | Can you put the heart together? |
| `puzzles/ask-11.m4a` | Can you put the star together? |
| `puzzles/ask-12.m4a` | Can you put the square together? |

**hint**: _gentle pointer voice_

| Clip file | Say this |
|---|---|
| `puzzles/hint-01.m4a` | the left side |
| `puzzles/hint-02.m4a` | the right side |
| `puzzles/hint-03.m4a` | the middle |
| `puzzles/hint-04.m4a` | Try the left side |
| `puzzles/hint-05.m4a` | Try the right side |
| `puzzles/hint-06.m4a` | Try the middle |

**done**: _proud_

| Clip file | Say this |
|---|---|
| `puzzles/done-01.m4a` | You made the dog! |
| `puzzles/done-02.m4a` | You made the cat! |
| `puzzles/done-03.m4a` | You made the duck! |
| `puzzles/done-04.m4a` | You made the fish! |
| `puzzles/done-05.m4a` | You made the car! |
| `puzzles/done-06.m4a` | You made the bus! |
| `puzzles/done-07.m4a` | You made the truck! |
| `puzzles/done-08.m4a` | You made the train! |
| `puzzles/done-09.m4a` | You made the circle! |
| `puzzles/done-10.m4a` | You made the heart! |
| `puzzles/done-11.m4a` | You made the star! |
| `puzzles/done-12.m4a` | You made the square! |

**sticker**: _clear naming_

| Clip file | Say this |
|---|---|
| `puzzles/sticker-01.m4a` | dog |
| `puzzles/sticker-02.m4a` | cat |
| `puzzles/sticker-03.m4a` | bus |
| `puzzles/sticker-04.m4a` | truck |
| `puzzles/sticker-05.m4a` | train |
| `puzzles/sticker-06.m4a` | heart |
| `puzzles/sticker-07.m4a` | star |

## 10 · Touch Your Nose

**intro**: _warm, inviting_

| Clip file | Say this |
|---|---|
| `body-parts/intro-01.m4a` | Where is the nose? |
| `body-parts/intro-02.m4a` | You can tap the friend, or show me on you. |
| `body-parts/intro-03.m4a` | Pick a friend! |
| `body-parts/intro-04.m4a` | Tap the star to sing together! |
| `body-parts/intro-05.m4a` | Here we go! |
| `body-parts/intro-06.m4a` | We sang together! |
| `body-parts/intro-07.m4a` | Find a few more body parts to earn a hat! |
| `body-parts/intro-08.m4a` | A hat! |
| `body-parts/intro-09.m4a` | No hat. |
| `body-parts/intro-10.m4a` | Look in Friends. |

**part**: _clear body-part word (also used for the song)_

| Clip file | Say this |
|---|---|
| `body-parts/part-01.m4a` | eyes |
| `body-parts/part-02.m4a` | nose |
| `body-parts/part-03.m4a` | mouth |
| `body-parts/part-04.m4a` | hair |
| `body-parts/part-05.m4a` | ears |
| `body-parts/part-06.m4a` | head |
| `body-parts/part-07.m4a` | tummy |
| `body-parts/part-08.m4a` | hands |
| `body-parts/part-09.m4a` | feet |
| `body-parts/part-10.m4a` | toes |
| `body-parts/part-11.m4a` | knees |
| `body-parts/part-12.m4a` | arms |
| `body-parts/part-13.m4a` | legs |
| `body-parts/part-14.m4a` | shoulders |
| `body-parts/part-15.m4a` | The eyes! |
| `body-parts/part-16.m4a` | The nose! |
| `body-parts/part-17.m4a` | The mouth! |
| `body-parts/part-18.m4a` | The hair! |
| `body-parts/part-19.m4a` | The ears! |
| `body-parts/part-20.m4a` | The head! |
| `body-parts/part-21.m4a` | The tummy! |
| `body-parts/part-22.m4a` | The hands! |
| `body-parts/part-23.m4a` | The feet! |
| `body-parts/part-24.m4a` | The toes! |
| `body-parts/part-25.m4a` | The knees! |
| `body-parts/part-26.m4a` | The arms! |
| `body-parts/part-27.m4a` | The legs! |
| `body-parts/part-28.m4a` | The shoulders! |

**ask**: _curious; point to your own_

| Clip file | Say this |
|---|---|
| `body-parts/ask-01.m4a` | Where is the eyes? |
| `body-parts/ask-02.m4a` | Where is the mouth? |
| `body-parts/ask-03.m4a` | Where is the hair? |
| `body-parts/ask-04.m4a` | Where is the ears? |
| `body-parts/ask-05.m4a` | Where is the head? |
| `body-parts/ask-06.m4a` | Where is the tummy? |
| `body-parts/ask-07.m4a` | Where is the hands? |
| `body-parts/ask-08.m4a` | Where is the feet? |
| `body-parts/ask-09.m4a` | Where is the toes? |
| `body-parts/ask-10.m4a` | Where is the knees? |
| `body-parts/ask-11.m4a` | Where is the arms? |
| `body-parts/ask-12.m4a` | Where is the legs? |
| `body-parts/ask-13.m4a` | Where is the shoulders? |
| `body-parts/ask-14.m4a` | Can you show me your eyes? |
| `body-parts/ask-15.m4a` | Can you show me your nose? |
| `body-parts/ask-16.m4a` | Can you show me your mouth? |
| `body-parts/ask-17.m4a` | Can you show me your hair? |
| `body-parts/ask-18.m4a` | Can you show me your ears? |
| `body-parts/ask-19.m4a` | Can you show me your head? |
| `body-parts/ask-20.m4a` | Can you show me your tummy? |
| `body-parts/ask-21.m4a` | Can you show me your hands? |
| `body-parts/ask-22.m4a` | Can you show me your feet? |
| `body-parts/ask-23.m4a` | Can you show me your toes? |
| `body-parts/ask-24.m4a` | Can you show me your knees? |
| `body-parts/ask-25.m4a` | Can you show me your arms? |
| `body-parts/ask-26.m4a` | Can you show me your legs? |
| `body-parts/ask-27.m4a` | Can you show me your shoulders? |
| `body-parts/ask-28.m4a` | Now show me your eyes! |
| `body-parts/ask-29.m4a` | Now show me your nose! |
| `body-parts/ask-30.m4a` | Now show me your mouth! |
| `body-parts/ask-31.m4a` | Now show me your hair! |
| `body-parts/ask-32.m4a` | Now show me your ears! |
| `body-parts/ask-33.m4a` | Now show me your head! |
| `body-parts/ask-34.m4a` | Now show me your tummy! |
| `body-parts/ask-35.m4a` | Now show me your hands! |
| `body-parts/ask-36.m4a` | Now show me your feet! |
| `body-parts/ask-37.m4a` | Now show me your toes! |
| `body-parts/ask-38.m4a` | Now show me your knees! |
| `body-parts/ask-39.m4a` | Now show me your arms! |
| `body-parts/ask-40.m4a` | Now show me your legs! |
| `body-parts/ask-41.m4a` | Now show me your shoulders! |

**found**: _proud_

| Clip file | Say this |
|---|---|
| `body-parts/found-01.m4a` | You found your eyes! |
| `body-parts/found-02.m4a` | You found your nose! |
| `body-parts/found-03.m4a` | You found your mouth! |
| `body-parts/found-04.m4a` | You found your hair! |
| `body-parts/found-05.m4a` | You found your ears! |
| `body-parts/found-06.m4a` | You found your head! |
| `body-parts/found-07.m4a` | You found your tummy! |
| `body-parts/found-08.m4a` | You found your hands! |
| `body-parts/found-09.m4a` | You found your feet! |
| `body-parts/found-10.m4a` | You found your toes! |
| `body-parts/found-11.m4a` | You found your knees! |
| `body-parts/found-12.m4a` | You found your arms! |
| `body-parts/found-13.m4a` | You found your legs! |
| `body-parts/found-14.m4a` | You found your shoulders! |

**model**: _teaching voice_

| Clip file | Say this |
|---|---|
| `body-parts/model-01.m4a` | That is the eyes on our friend. |
| `body-parts/model-02.m4a` | That is the eyes on the bear. |
| `body-parts/model-03.m4a` | That is the eyes on the robot. |
| `body-parts/model-04.m4a` | That is the nose on our friend. |
| `body-parts/model-05.m4a` | That is the nose on the bear. |
| `body-parts/model-06.m4a` | That is the nose on the robot. |
| `body-parts/model-07.m4a` | That is the mouth on our friend. |
| `body-parts/model-08.m4a` | That is the mouth on the bear. |
| `body-parts/model-09.m4a` | That is the mouth on the robot. |
| `body-parts/model-10.m4a` | That is the hair on our friend. |
| `body-parts/model-11.m4a` | That is the hair on the bear. |
| `body-parts/model-12.m4a` | That is the hair on the robot. |
| `body-parts/model-13.m4a` | That is the ears on our friend. |
| `body-parts/model-14.m4a` | That is the ears on the bear. |
| `body-parts/model-15.m4a` | That is the ears on the robot. |
| `body-parts/model-16.m4a` | That is the head on our friend. |
| `body-parts/model-17.m4a` | That is the head on the bear. |
| `body-parts/model-18.m4a` | That is the head on the robot. |
| `body-parts/model-19.m4a` | That is the tummy on our friend. |
| `body-parts/model-20.m4a` | That is the tummy on the bear. |
| `body-parts/model-21.m4a` | That is the tummy on the robot. |
| `body-parts/model-22.m4a` | That is the hands on our friend. |
| `body-parts/model-23.m4a` | That is the hands on the bear. |
| `body-parts/model-24.m4a` | That is the hands on the robot. |
| `body-parts/model-25.m4a` | That is the feet on our friend. |
| `body-parts/model-26.m4a` | That is the feet on the bear. |
| `body-parts/model-27.m4a` | That is the feet on the robot. |
| `body-parts/model-28.m4a` | That is the toes on our friend. |
| `body-parts/model-29.m4a` | That is the toes on the bear. |
| `body-parts/model-30.m4a` | That is the toes on the robot. |
| `body-parts/model-31.m4a` | That is the knees on our friend. |
| `body-parts/model-32.m4a` | That is the knees on the bear. |
| `body-parts/model-33.m4a` | That is the knees on the robot. |
| `body-parts/model-34.m4a` | That is the arms on our friend. |
| `body-parts/model-35.m4a` | That is the arms on the bear. |
| `body-parts/model-36.m4a` | That is the arms on the robot. |
| `body-parts/model-37.m4a` | That is the legs on our friend. |
| `body-parts/model-38.m4a` | That is the legs on the bear. |
| `body-parts/model-39.m4a` | That is the legs on the robot. |
| `body-parts/model-40.m4a` | That is the shoulders on our friend. |
| `body-parts/model-41.m4a` | That is the shoulders on the bear. |
| `body-parts/model-42.m4a` | That is the shoulders on the robot. |
| `body-parts/model-43.m4a` | That's the eyes! |
| `body-parts/model-44.m4a` | That's the nose! |
| `body-parts/model-45.m4a` | That's the mouth! |
| `body-parts/model-46.m4a` | That's the hair! |
| `body-parts/model-47.m4a` | That's the ears! |
| `body-parts/model-48.m4a` | That's the head! |
| `body-parts/model-49.m4a` | That's the tummy! |
| `body-parts/model-50.m4a` | That's the hands! |
| `body-parts/model-51.m4a` | That's the feet! |
| `body-parts/model-52.m4a` | That's the toes! |
| `body-parts/model-53.m4a` | That's the knees! |
| `body-parts/model-54.m4a` | That's the arms! |
| `body-parts/model-55.m4a` | That's the legs! |
| `body-parts/model-56.m4a` | That's the shoulders! |

**friend**: _friendly_

| Clip file | Say this |
|---|---|
| `body-parts/friend-01.m4a` | Hello, our friend! |
| `body-parts/friend-02.m4a` | Hello, the bear! |
| `body-parts/friend-03.m4a` | Hello, the robot! |
| `body-parts/friend-04.m4a` | Play a little more to meet our friend! |
| `body-parts/friend-05.m4a` | Play a little more to meet the bear! |
| `body-parts/friend-06.m4a` | Play a little more to meet the robot! |
| `body-parts/friend-07.m4a` | Our friend wants to play! |
| `body-parts/friend-08.m4a` | The bear wants to play! |
| `body-parts/friend-09.m4a` | The robot wants to play! |
