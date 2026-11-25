-- Additive only: new table, rate-limit table in the unexposed `app` schema,
-- and a public RPC. Does not alter existing tables or functions.
-- Applied to Supabase project fxdzfqijogsdmcqclpaf.

CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

CREATE TABLE public.commander_wall (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scryfall_id uuid NOT NULL,
  name text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT commander_wall_name_len CHECK (char_length(name) BETWEEN 1 AND 200),
  CONSTRAINT commander_wall_image_host CHECK (image_url LIKE 'https://cards.scryfall.io/%')
);

CREATE INDEX commander_wall_created_at_idx
  ON public.commander_wall (created_at DESC, id DESC);

-- Unexposed; used only by the SECURITY DEFINER RPC.
CREATE TABLE app.commander_wall_rate (
  ip_hash bytea NOT NULL,
  kind text NOT NULL CHECK (kind IN ('burst', 'window', 'global')),
  window_start timestamptz NOT NULL,
  count int NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (ip_hash, kind, window_start)
);

ALTER TABLE public.commander_wall ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.commander_wall_rate ENABLE ROW LEVEL SECURITY;

CREATE POLICY commander_wall_public_read
  ON public.commander_wall
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.commander_wall TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.commander_wall FROM anon, authenticated, PUBLIC;
REVOKE ALL ON TABLE app.commander_wall_rate FROM anon, authenticated, PUBLIC;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'commander_wall'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.commander_wall;
  END IF;
END
$$;

-- Internal: rate-limit + insert after the caller has already verified the
-- Scryfall payload. Not granted to anon.
CREATE OR REPLACE FUNCTION app.post_commander(
  p_scryfall_id uuid,
  p_name text,
  p_image_url text,
  p_ip text
)
RETURNS public.commander_wall
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app, public, extensions, pg_temp
AS $$
DECLARE
  v_ip text := left(trim(COALESCE(p_ip, '')), 128);
  v_hash bytea;
  v_now timestamptz := clock_timestamp();
  v_count int;
  v_row public.commander_wall;
BEGIN
  IF p_scryfall_id IS NULL THEN
    RAISE EXCEPTION 'invalid card' USING ERRCODE = '22023';
  END IF;

  p_name := left(trim(COALESCE(p_name, '')), 200);
  p_image_url := trim(COALESCE(p_image_url, ''));
  IF p_name = '' OR p_image_url NOT LIKE 'https://cards.scryfall.io/%' THEN
    RAISE EXCEPTION 'invalid card' USING ERRCODE = '22023';
  END IF;

  IF v_ip = '' THEN
    v_ip := 'unknown';
  END IF;
  v_hash := extensions.digest(convert_to(v_ip || '|commander-wall-v1', 'utf8'), 'sha256');

  INSERT INTO app.commander_wall_rate (ip_hash, kind, window_start, count)
  VALUES (
    v_hash,
    'burst',
    to_timestamp(floor(extract(epoch FROM v_now) / 8) * 8),
    1
  )
  ON CONFLICT (ip_hash, kind, window_start)
  DO UPDATE SET count = app.commander_wall_rate.count + 1
  RETURNING count INTO v_count;
  IF v_count > 1 THEN
    RAISE EXCEPTION 'rate limited' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO app.commander_wall_rate (ip_hash, kind, window_start, count)
  VALUES (
    v_hash,
    'window',
    to_timestamp(floor(extract(epoch FROM v_now) / 600) * 600),
    1
  )
  ON CONFLICT (ip_hash, kind, window_start)
  DO UPDATE SET count = app.commander_wall_rate.count + 1
  RETURNING count INTO v_count;
  IF v_count > 5 THEN
    RAISE EXCEPTION 'rate limited' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO app.commander_wall_rate (ip_hash, kind, window_start, count)
  VALUES (
    extensions.digest(convert_to('global|commander-wall-v1', 'utf8'), 'sha256'),
    'global',
    to_timestamp(floor(extract(epoch FROM v_now) / 60) * 60),
    1
  )
  ON CONFLICT (ip_hash, kind, window_start)
  DO UPDATE SET count = app.commander_wall_rate.count + 1
  RETURNING count INTO v_count;
  IF v_count > 40 THEN
    RAISE EXCEPTION 'rate limited' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.commander_wall (scryfall_id, name, image_url)
  VALUES (p_scryfall_id, p_name, p_image_url)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION app.post_commander(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.post_commander(uuid, text, text, text) TO postgres, service_role;

-- Helpers for the public RPC (not granted to visitors).
CREATE OR REPLACE FUNCTION app.commander_text_ok(p_type text, p_oracle text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = app, public, pg_temp
AS $$
  SELECT
    (COALESCE(p_type, '') ~* 'legendary' AND COALESCE(p_type, '') ~* 'creature')
    OR COALESCE(p_oracle, '') ~* 'can be your commander'
    OR (
      COALESCE(p_type, '') ~* 'legendary'
      AND COALESCE(p_oracle, '') ~* 'creature in addition to its other types'
    );
$$;

CREATE OR REPLACE FUNCTION app.is_legal_commander(p_card jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = app, public, pg_temp
AS $$
DECLARE
  v_face jsonb;
BEGIN
  IF p_card IS NULL OR (p_card #>> '{legalities,commander}') IS DISTINCT FROM 'legal' THEN
    RETURN false;
  END IF;
  IF app.commander_text_ok(p_card ->> 'type_line', p_card ->> 'oracle_text') THEN
    RETURN true;
  END IF;
  FOR v_face IN SELECT value FROM jsonb_array_elements(COALESCE(p_card -> 'card_faces', '[]'::jsonb))
  LOOP
    IF app.commander_text_ok(v_face ->> 'type_line', v_face ->> 'oracle_text') THEN
      RETURN true;
    END IF;
  END LOOP;
  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION app.commander_text_ok(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app.is_legal_commander(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION app.commander_text_ok(text, text) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION app.is_legal_commander(jsonb) TO postgres, service_role;

CREATE OR REPLACE FUNCTION public.post_commander(p_scryfall_id uuid)
RETURNS public.commander_wall
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app, public, extensions, pg_temp
AS $$
DECLARE
  v_headers json;
  v_ip text;
  v_status int;
  v_content text;
  v_card jsonb;
  v_name text;
  v_image text;
BEGIN
  IF p_scryfall_id IS NULL THEN
    RAISE EXCEPTION 'invalid card' USING ERRCODE = '22023';
  END IF;

  BEGIN
    v_headers := current_setting('request.headers', true)::json;
  EXCEPTION WHEN OTHERS THEN
    v_headers := '{}'::json;
  END;
  v_ip := trim(split_part(COALESCE(v_headers ->> 'x-forwarded-for', ''), ',', 1));
  IF v_ip = '' THEN
    v_ip := COALESCE(NULLIF(v_headers ->> 'cf-connecting-ip', ''), inet_client_addr()::text, 'unknown');
  END IF;

  BEGIN
    PERFORM extensions.http_set_curlopt('CURLOPT_TIMEOUT', '8');
    PERFORM extensions.http_set_curlopt('CURLOPT_CONNECTTIMEOUT', '5');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  SELECT status, content
  INTO v_status, v_content
  FROM extensions.http((
    'GET',
    'https://api.scryfall.com/cards/' || p_scryfall_id::text,
    ARRAY[
      extensions.http_header('Accept', 'application/json'),
      extensions.http_header('User-Agent', 'commander-wall/1.0 (https://airronkennedy.com)')
    ],
    NULL,
    NULL
  )::extensions.http_request);

  IF v_status IS DISTINCT FROM 200 OR v_content IS NULL OR left(trim(v_content), 1) <> '{' THEN
    RAISE EXCEPTION 'invalid card' USING ERRCODE = '22023';
  END IF;

  v_card := v_content::jsonb;
  IF (v_card ->> 'id') IS DISTINCT FROM p_scryfall_id::text THEN
    RAISE EXCEPTION 'invalid card' USING ERRCODE = '22023';
  END IF;
  IF NOT app.is_legal_commander(v_card) THEN
    RAISE EXCEPTION 'not a commander' USING ERRCODE = '22023';
  END IF;

  v_name := left(trim(COALESCE(v_card ->> 'name', '')), 200);
  v_image := COALESCE(
    v_card #>> '{image_uris,large}',
    v_card #>> '{image_uris,normal}',
    v_card #>> '{card_faces,0,image_uris,large}',
    v_card #>> '{card_faces,0,image_uris,normal}'
  );
  IF v_name = '' OR v_image IS NULL OR v_image NOT LIKE 'https://cards.scryfall.io/%' THEN
    RAISE EXCEPTION 'invalid card' USING ERRCODE = '22023';
  END IF;

  RETURN app.post_commander(p_scryfall_id, v_name, v_image, v_ip);
END;
$$;

REVOKE ALL ON FUNCTION public.post_commander(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.post_commander(uuid) TO anon, authenticated;

-- The http client is only for this RPC. Do not leave it callable by visitors.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS nsp, p.proname AS name, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'extensions'
      AND p.proname IN (
        'http', 'http_get', 'http_post', 'http_put', 'http_patch', 'http_delete',
        'http_set_curlopt', 'http_reset_curlopt', 'http_header'
      )
  LOOP
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
      r.nsp, r.name, r.args
    );
  END LOOP;
END
$$;
