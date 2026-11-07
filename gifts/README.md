# Christmas gifts (Windows apps)

Each folder here becomes one Windows `.exe` on https://airronkennedy.com/christmas/.

## Add a new family app
1. Make a folder `gifts/<app-name>/` with a `main.py` (tkinter or any Python GUI).
   Optional: `requirements.txt` (extra pip packages) and `icon.ico` (app icon).
2. Commit and push to `main`.
3. Push a new tag: `git tag gifts-vN && git push origin gifts-vN` (N = next number).
   GitHub Actions (`.github/workflows/build-gifts.yml`) builds every app with PyInstaller
   and attaches `<app-name>.exe` files to the release `gifts-vN`.
4. In `christmas/gifts.js`, set the card's `app`, `desc`, `tag: 'gifts-vN'`, and `file: '<app-name>.exe'`,
   then bump the `?v=` tags in `christmas/index.html`, commit, and push.
