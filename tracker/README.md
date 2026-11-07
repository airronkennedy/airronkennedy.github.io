# Team Task Tracker

Static, dependency-free forms for the existing GitHub Pages site.

- The green verdigris planet opens the shared access-code dialog; `/tracker/` gates direct visits too.
- The code is compared with a SHA-256 digest using Web Crypto when available, or an inline pure-JavaScript SHA-256 fallback on plain HTTP. The session flag is in sessionStorage, and Lock removes it.
- This is a casual UI gate, NOT authentication, encryption, or secure storage. Source files are public and the gate can be bypassed. Do not use for sensitive information.
- Sheet values are stored in localStorage on this browser/device only. They are never sent to a server and are not synchronized among crew members. Clearing browser data removes them.
- Print only the active sheet: Letter portrait for timesheets and single supply requests, Letter landscape for two identical supply requests side by side. Disable browser print headers/footers and use 100% scale for the intended measurements.
- Clear asks for confirmation and only clears the selected sheet. Enlarge paper provides full-size editing with scrolling on small screens; Fit paper restores the compact preview.
- Paper layouts were recreated from the reference photo with blank fields, not embedded photographs. No identifying text from the photo is included.

## Building supply catalog

Edit `supplies.js` to add buildings and `{item, unit}` entries. All photographed items, including shaded rows, are retained; stock counts and handwritten quantities are excluded. OCB's trash-liners-only note is shown on screen without deleting its reference items.

The Supply Request has a building selector plus Other site, 18 item selectors with quantity fields, and an Other/type-item fallback per line. Switching buildings preserves unavailable selections as custom text. Existing browser-saved free-text requests migrate to Other fields. Printed lines contain only item, unit, and entered quantity; untouched lines remain blank rules. Timesheet SITE cells offer the same building names while allowing arbitrary text.
