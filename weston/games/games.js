/* Weston's Planet game registry. The hub (/weston/) builds its menu from this list.
   To launch a game: build /weston/games/<slug>/index.html, then set live: true on its entry.
   Keep the order and slugs stable; owner = which bot builds it. See /weston/games/README.md. */
window.WESTON_GAMES = [
  { n: 1,  slug: 'bubble-pop',     title: 'Bubble Pop',      icon: '🫧', color: '#4fb3e8', skill: 'Cause & effect',   owner: 'Airron Bot', live: true },
  { n: 2,  slug: 'animal-sounds',  title: 'Animal Sounds',   icon: '🐮', color: '#f0a64a', skill: 'Words & listening', owner: 'Airron Bot', live: true },
  { n: 3,  slug: 'shape-sorter',   title: 'Shape Sorter',    icon: '🔺', color: '#9a7bf0', skill: 'Shapes',            owner: 'Airron Bot', live: true },
  { n: 4,  slug: 'color-match',    title: 'Color Match',     icon: '🎨', color: '#ef6a7a', skill: 'Colors',            owner: 'Airron Bot', live: true },
  { n: 5,  slug: 'counting-ducks', title: 'Counting Ducks',  icon: '🦆', color: '#f2cf3d', skill: 'Counting 1–3',      owner: 'Game Bot',   live: true },
  { n: 6,  slug: 'peekaboo',       title: 'Peekaboo',        icon: '🙈', color: '#5cc99a', skill: 'Hidden things',     owner: 'Game Bot',   live: true },
  { n: 7,  slug: 'big-small',      title: 'Big & Small',     icon: '🐘', color: '#7fa6c9', skill: 'Big vs. small',     owner: 'Game Bot',   live: true },
  { n: 8,  slug: 'drum-pad',       title: 'Music Pad',       icon: '🥁', color: '#e8804f', skill: 'Rhythm & sound',    owner: 'Bartenbot',  live: true },
  { n: 9,  slug: 'puzzles',        title: 'Puzzles',         icon: '🧩', color: '#4fc2c9', skill: 'Parts & wholes',    owner: 'Bartenbot',  live: false },
  { n: 10, slug: 'body-parts',     title: 'Touch Your Nose', icon: '👃', color: '#e88fc2', skill: 'Body words',        owner: 'Bartenbot',  live: false }
];
