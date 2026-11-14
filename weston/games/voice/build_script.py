#!/usr/bin/env python3
"""Builds the voice recording script (SCRIPT.md) and the clip manifest (clips.js) for Weston's games.
Every line the games can speak is listed here, expanded from each game's word lists.
Lines are split into sentences the same way shell.js splits them, so each sentence is one clip.
Re-run after a game adds or changes spoken lines:  python3 weston/games/voice/build_script.py"""
import re, json, os, itertools
HERE = os.path.dirname(os.path.abspath(__file__))

def sentences(text):  # must match splitSentences() in shell/shell.js
    return [s.strip() for s in re.findall(r'[^.!?…]+[.!?…]*', text) if s.strip()]
def key(s):           # must match voiceKey() in shell/shell.js
    s = s.lower().replace('\u2019', "'").replace('\u2018', "'")
    s = re.sub(r"[^a-z0-9' ]+", ' ', s)
    return re.sub(r'\s+', ' ', s).strip()
def cap(s): return s[:1].upper() + s[1:]

G = []  # (game, title, [(category, tone, [lines])])
def game(slug, title, groups): G.append((slug, title, groups))

PRAISE = ['Yay!', 'Great job!', 'You did it!', 'Wow!', 'Hooray!', 'Nice!', 'So good!', 'Way to go!']
game('shell', 'Shared (every game)', [
  ('praise', 'big, warm, proud (these play after every win, in all games)', PRAISE),
  ('jar', 'excited, a little sing-song', ['You filled up all the stars! Hooray!']),
])

# 1 Bubble Pop
FR = ['A fish!', 'A duck!', 'A star!', 'A frog!', 'A puppy!', 'An apple!', 'A car!', 'A kitty!', 'A bee!', 'A balloon!']
game('bubble-pop', '1 · Bubble Pop', [
  ('prompt', 'cheerful invitation', ['Pop the bubbles!']),
  ('pop', 'quick and playful, a little high', ['Pop!', 'Pop pop!']),
  ('friend', 'surprised and delighted, naming what popped out', FR),
  ('gold', 'amazed', ['Wow! A golden bubble!']),
  ('scene', 'storyteller, "look where we are!"', ['Bubbles in the sea!', 'Bubbles in the sky!', 'Bubbles in space!']),
])

# 2 Animal Sounds
AN = [('cow', 'Moooo!'), ('sheep', 'Baaa!'), ('pig', 'Oink oink!'), ('duck', 'Quack quack!'), ('dog', 'Woof woof!'), ('cat', 'Meow!'), ('horse', 'Neigh!'), ('chicken', 'Cluck cluck!')]
game('animal-sounds', '2 · Animal Sounds', [
  ('intro', 'warm, inviting', ["Let's meet the animals!", 'Animal dance party!', 'The sun!']),
  ('sound', 'do your best animal voice, have fun with it', [s for _, s in AN]),
  ('meet', 'clear and slow, introducing a friend', ['This is the %s.' % n for n, _ in AN] + ['The %s says %s' % (n, s) for n, s in AN]),
  ('ask', 'curious question, clear animal word', ['Who says %s' % s for _, s in AN] + ['Find the %s!' % n for n, _ in AN] + ['Where is the %s?' % n for n, _ in AN]),
  ('yes', 'proud, name the animal clearly', ['Yes!'] + ['The %s!' % n for n, _ in AN]),
  ('other', 'friendly "oh, that one is…", never disappointed', ["That's the %s!" % n for n, _ in AN]),
])

# 3 Shape Sorter
SH = ['circle', 'square', 'triangle']
game('shape-sorter', '3 · Shape Sorter', [
  ('intro', 'cheerful invitation', ['Put the shapes in the box!', 'You sorted all the shapes! Circle, square, triangle!']),
  ('name', 'clear, a little emphasis on the shape word', SH + ['A %s!' % s for s in SH] + ['%s!' % cap(s) for s in SH]),
  ('fit', 'happy "plunk!"', ['Yes!', 'It fits!', 'Plunk!'] + ['The %s goes in the %s!' % (s, s) for s in SH]),
  ('hint', 'gentle, curious, no disappointment', ["That's a %s hole." % h for h in SH] + ['Where does the %s go?' % s for s in SH]),
])

# 4 Color Match
CO = ['red', 'blue', 'yellow', 'green']
PIC = {'red': ['apple', 'car'], 'blue': ['fish', 'ball'], 'yellow': ['sun', 'duck'], 'green': ['leaf', 'frog']}
game('color-match', '4 · Color Match', [
  ('intro', 'cheerful', ["Let's paint!", 'Paint party! Red, blue, yellow, green!']),
  ('color', 'clear color word, bright and happy', CO + ['%s!' % cap(c) for c in CO]),
  ('ask', 'inviting, emphasize the color', ["Let's paint the %s %s!" % (p, c) for c in CO for p in PIC[c]] + ['Find %s!' % c for c in CO] + ['Can you find %s?' % c for c in CO]),
  ('done', 'proud, name color + thing', ['A %s %s!' % (c, p) for c in CO for p in PIC[c]] + [p + '!' for c in CO for p in PIC[c]]),
  ('other', 'friendly "oh, that one is…"', ["That's %s!" % c for c in CO]),
])

# 5 Counting Ducks (Game Bot)
game('counting-ducks', '5 · Counting Ducks', [
  ('intro', 'cheerful', ["Let's count ducks!", 'Can you tap the ducks?', 'Tap the ducks!', 'Quack quack!']),
  ('count', 'slow, clear counting voice, one number per tap', ['One', 'Two', 'Three', 'One,', 'Two,', 'Three.', '1', '2', '3']),
  ('total', 'proud, "we counted them!"', ['One duck!', 'Two ducks!', 'Three ducks!']),
])

# 6 Peekaboo (Game Bot)
PF = ['Teddy', 'Puppy', 'Kitty', 'Bunny', 'Duck']; PC = ['blanket', 'leaf', 'box', 'cushion', 'hands']
game('peekaboo', '6 · Peekaboo', [
  ('intro', 'playful, a little mysterious', ["Peekaboo! Let's find our friends!", 'Not here…']),
  ('name', 'happy greeting', ['%s!' % f for f in PF] + ["It's %s!" % f for f in PF]),
  ('where', 'whispery, curious', ["Where's %s?" % f for f in PF] + ['Under the %s!' % c for c in PC]),
  ('found', 'big "peekaboo!" reveal', ['Peekaboo!'] + ["There's %s!" % f for f in PF] + ['You found %s!' % f for f in PF]),
  ('hide', 'sing-song, "go hide!"', ['Peekaboo?'] + ['Hide, %s!' % f for f in PF]),
])

# 7 Big & Small (Game Bot)
BK = ['duck', 'bear', 'cup', 'truck', 'apple', 'elephant', 'ball']
game('big-small', '7 · Big & Small', [
  ('intro', 'cheerful', ["Let's find the big one and the little one!", 'Look!']),
  ('show', 'BIG voice for big, tiny voice for little', ['A big %s and a little %s.' % (k, k) for k in BK]),
  ('ask', 'BIG voice for big, tiny voice for little', ['Where is the %s %s?' % (w, k) for k in BK for w in ['big', 'little']]),
  ('yes', 'proud; BIG or tiny voice to match', ['Yes!'] + ['That is the %s %s!' % (w, k) for k in BK for w in ['big', 'little']]),
  ('other', 'friendly, never disappointed', ["That's the %s %s!" % (w, k) for k in BK for w in ['big', 'little']] + ['This one is big.', 'This one is little.']),
])

# 8 Music Pad (Bartenbot)
PADS = ['Drum', 'Shaker', 'Bell', 'Block', 'Crash', 'Toot']
game('drum-pad', '8 · Music Pad', [
  ('intro', 'upbeat, musical', ['Tap a drum!', 'Your turn!', 'Your turn! Tap a drum.', 'Go!', 'Tap go!', 'Stop! Freeze!', 'You played too!']),
  ('hit', 'snappy, name the instrument', ['%s!' % p for p in PADS] + ['Tap the %s!' % p.lower() for p in PADS]),
  ('mode', 'announcer, fun', ['Drums! Tap to play.', 'Copy me! You can play along.', 'Parade! Tap go, then stop.', 'Band time! Play with friends.']),
  ('friend', 'surprised and happy', ['A new friend!', 'A fox!', 'A bird!', 'A bear!']),
])

# 9 Puzzles (Bartenbot)
PZ = ['dog', 'cat', 'duck', 'fish', 'car', 'bus', 'truck', 'train', 'circle', 'heart', 'star', 'square']
SIDES = ['the left side', 'the right side', 'the middle']
game('puzzles', '9 · Puzzles', [
  ('intro', 'calm, encouraging', ['Put the big pieces together. Two pieces first, then three. You can drag or tap.', 'Finish a puzzle to earn a sticker!', 'Your stickers!']),
  ('ask', 'inviting', ['Can you put the %s together?' % p for p in PZ]),
  ('hint', 'gentle pointer voice', SIDES + ['Try %s' % s for s in SIDES]),
  ('done', 'proud', ['You made the %s!' % p for p in PZ]),
  ('sticker', 'clear naming', PZ),
])

# 10 Touch Your Nose (Bartenbot)
BP = ['eyes', 'nose', 'mouth', 'hair', 'ears', 'head', 'tummy', 'hands', 'feet', 'toes', 'knees', 'arms', 'legs', 'shoulders']
BF = ['our friend', 'the bear', 'the robot']
game('body-parts', '10 · Touch Your Nose', [
  ('intro', 'warm, inviting', ['Where is the nose? You can tap the friend, or show me on you.', 'Pick a friend!', 'Tap the star to sing together!', 'Here we go!', 'We sang together!', 'Find a few more body parts to earn a hat!', 'A hat!', 'No hat.', 'Look in Friends.']),
  ('part', 'clear body-part word (also used for the song)', BP + ['The %s!' % p for p in BP]),
  ('ask', 'curious; point to your own', ['Where is the %s?' % p for p in BP] + ['Can you show me your %s?' % p for p in BP] + ['Now show me your %s!' % p for p in BP]),
  ('found', 'proud', ['You found your %s!' % p for p in BP]),
  ('model', 'teaching voice', ['That is the %s on %s.' % (p, f) for p in BP for f in BF] + ["That's the %s!" % p for p in BP]),
  ('friend', 'friendly', ['Hello, %s!' % f for f in BF] + ['Play a little more to meet %s!' % f for f in BF] + ['%s wants to play!' % cap(f) for f in BF]),
])

seen = {}; manifest = {}; out = []; n = 0
for slug, title, groups in G:
    sec = []
    for cat, tone, lines in groups:
        rows = []
        for line in lines:
            for s in sentences(line):
                k = key(s)
                if not k or k in seen: continue
                cnt = sum(1 for v in manifest.values() if v.startswith(slug + '/' + cat + '-')) + 1
                f = '%s/%s-%02d.m4a' % (slug, cat, cnt)
                seen[k] = f; manifest[k] = f; rows.append((f, s)); n += 1
        if rows:
            sec.append('\n**%s**: _%s_\n\n| Clip file | Say this |\n|---|---|\n' % (cat, tone) + ''.join('| `%s` | %s |\n' % (f, s.replace('|', '\\|')) for f, s in rows))
    if sec: out.append('\n## %s\n' % title + ''.join(sec))

head = """# Weston's games: Dad's voice recording script

Record each line below in your own voice and save it at `weston/games/voice/<Clip file>`. For example, `bubble-pop/pop-01.m4a` goes in `weston/games/voice/bubble-pop/pop-01.m4a`.
Drop the files in **one at a time, in any order**. Any line that has a recording plays your voice. Lines you haven't recorded yet still use the device voice.

- **%d lines** in total, each listed once. If two games say the exact same sentence, it appears under the first game only, and one clip covers both.
- **Format:** `.m4a` (iPhone Voice Memos/AAC). Speak close to the mic in a quiet room. Leave about ½ second of silence at the start and end. Keep it short, warm, and a bit slower than normal talking, like you're talking to Weston.
- **Sentence clips:** the games build longer lines from these sentences. For example, "Yes!" + "The cow!" + "Moooo!" plays as three clips back to back, so record each sentence by itself with its own punctuation and energy.
- **How it works:** `voice/clips.js` maps each sentence to its file. The shell tries your file first and falls back to the device voice if the file isn't there yet. After you add or change spoken lines in a game, re-run `python3 weston/games/voice/build_script.py` to rebuild this script and `clips.js`.
""" % n
open(os.path.join(HERE, 'SCRIPT.md'), 'w').write(head + ''.join(out))
have = []
for root, dirs, files in os.walk(HERE):
    for fn in files:
        if fn.lower().endswith(('.m4a', '.mp3', '.wav', '.aac', '.ogg')):
            have.append(os.path.relpath(os.path.join(root, fn), HERE).replace('\\', '/'))
have.sort()
open(os.path.join(HERE, 'clips.js'), 'w').write(
    '/* Generated by build_script.py. Maps a spoken sentence (normalized) to Dad\'s recording in /weston/games/voice/. */\n'
    'window.WESTON_VOICE = ' + json.dumps(manifest, indent=0, ensure_ascii=False) + ';\n'
    '/* Filenames that are actually in this folder. The shell only fetches these, so missing recordings do not 404. */\n'
    'window.WESTON_VOICE_FILES = ' + json.dumps(have) + ';\n')
print(n, 'lines,', len(have), 'recorded clips')
