# Commander Wall

Public page at `/commanders/`. Visitors search a commander (Scryfall, same `is:commander` query used in MTG Commander) and post it to a shared wall of large card images, newest first.

The page is static (GitHub Pages) and talks to the existing Supabase project with the public anon key. Posts go through `public.post_commander(p_scryfall_id uuid)`, which looks the card up on Scryfall, checks it can be a commander, stores Scryfall’s name and image URL, and rate-limits by IP. Visitors cannot insert into the table directly, and they cannot send free text.

Schema applied to the shared project is in `schema.sql` (plus the follow-up in `schema_is_commander.sql`). Do not merge this branch until the preview has been checked.
