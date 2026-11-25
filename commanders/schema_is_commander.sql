-- Replace the is:commander search lookup (Scryfall treats hyphens in ids as
-- operators) with a /cards/{id} fetch plus an is:commander-equivalent check,
-- including Grist-style command-zone creatures.

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
