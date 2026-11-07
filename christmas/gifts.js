/* Christmas gift list. To publish one: push a tag like gifts-v1 (GitHub Actions builds the .exe
   and attaches it to the release), then set `file` to the .exe name and `tag` to that tag.
   Leave `file` empty to show "Coming soon". */
var GIFT_REPO = 'airronkennedy/airronkennedy.github.io';
var GIFTS = [
  { who: 'Buffi (Mom)', app: 'Coming soon', icon: '🎁', desc: 'A little app made just for Mom.', tag: '', file: '' },
  { who: 'Weston',      app: 'Coming soon', icon: '🚀', desc: 'A little app made just for Weston.', tag: '', file: '' },
  { who: 'Everyone',    app: 'Hello Christmas', icon: '❄️', desc: 'A tiny snowy "Merry Christmas" window. Test gift for the build pipeline.', tag: 'gifts-v1', file: 'hello-christmas.exe' }
];
