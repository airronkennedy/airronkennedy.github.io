/* Christmas gift list. To publish one: push a tag like gifts-v1 (GitHub Actions builds the .exe
   and attaches it to the release), then set `file` to the .exe name and `tag` to that tag.
   Leave `file` empty to show "Coming soon". */
var GIFT_REPO = 'airronkennedy/airronkennedy.github.io';
var GIFTS = [
  { who: 'Buffi (Mom)', app: 'Coming soon', icon: '🎁', desc: 'A little app made just for Mom.', tag: '', file: '' },
  { who: 'Weston',      app: 'Coming soon', icon: '🚀', desc: 'A little app made just for Weston.', tag: '', file: '' },
  { who: 'Allyson', app: 'Coming soon', icon: '🎁', desc: 'A gift app is on its way.', tag: '', file: '' },
  { who: 'Hunter', app: 'Coming soon', icon: '⭐', desc: 'A gift app is on its way.', tag: '', file: '' },
  { who: 'Genna', app: 'Coming soon', icon: '🔔', desc: 'A gift app is on its way.', tag: '', file: '' },
  { who: 'Anthony', app: 'Coming soon', icon: '🎄', desc: 'A gift app is on its way.', tag: '', file: '' },
  { who: 'Laura', app: 'Coming soon', icon: '❄️', desc: 'A gift app is on its way.', tag: '', file: '' },
  { who: 'Eddy', app: 'Coming soon', icon: '🕯️', desc: 'A gift app is on its way.', tag: '', file: '' },
  { who: 'Carrie', app: 'Coming soon', icon: '🧦', desc: 'A gift app is on its way.', tag: '', file: '' },
  { who: 'Kate', app: 'Coming soon', icon: '🎀', desc: 'A gift app is on its way.', tag: '', file: '' },
  { who: 'Collin', app: 'Coming soon', icon: '⛄', desc: 'A gift app is on its way.', tag: '', file: '' },
  { who: 'Jack', app: 'Coming soon', icon: '🍪', desc: 'A gift app is on its way.', tag: '', file: '' },
  { who: 'Carter', app: 'Coming soon', icon: '🦌', desc: 'A gift app is on its way.', tag: '', file: '' },
  { who: 'Everyone',    app: 'Hello Christmas', icon: '❄️', desc: 'A tiny snowy "Merry Christmas" window. Test gift for the build pipeline.', tag: 'gifts-v1', file: 'hello-christmas.exe' }
];
