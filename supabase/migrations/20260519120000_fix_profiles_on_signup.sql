-- Unique username helper + reliable profile creation on signup

CREATE OR REPLACE FUNCTION public.unique_username(base text, uid uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  candidate text;
  n int := 0;
BEGIN
  candidate := left(trim(base), 24);
  IF candidate IS NULL OR length(candidate) < 3 THEN
    candidate := 'trainer';
  END IF;
  WHILE EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(candidate) AND user_id IS DISTINCT FROM uid
  ) LOOP
    n := n + 1;
    candidate := left(trim(base), 16) || '_' || substr(replace(uid::text, '-', ''), 1, 6) || CASE WHEN n > 1 THEN n::text ELSE '' END;
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uname text;
  urole text := 'user';
BEGIN
  uname := COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1));
  uname := public.unique_username(uname, NEW.id);

  IF lower(uname) = 'admin' AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE lower(role) = 'admin') THEN
    urole := 'admin';
  END IF;

  INSERT INTO public.profiles (user_id, username, avatar_url, role)
  VALUES (NEW.id, uname, NEW.raw_user_meta_data ->> 'avatar_url', urole)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Backfill profiles for auth users missing one (e.g. username conflict swallowed insert)
INSERT INTO public.profiles (user_id, username, avatar_url, role)
SELECT
  u.id,
  public.unique_username(
    COALESCE(u.raw_user_meta_data ->> 'username', split_part(u.email, '@', 1)),
    u.id
  ),
  u.raw_user_meta_data ->> 'avatar_url',
  'user'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- Client fallback when trigger did not run
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  u record;
  existing public.profiles;
  uname text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO existing FROM public.profiles WHERE user_id = uid;
  IF FOUND THEN
    RETURN existing;
  END IF;

  SELECT id, email, raw_user_meta_data INTO u FROM auth.users WHERE id = uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  uname := public.unique_username(
    COALESCE(u.raw_user_meta_data ->> 'username', split_part(u.email, '@', 1)),
    uid
  );

  INSERT INTO public.profiles (user_id, username, avatar_url, role)
  VALUES (uid, uname, u.raw_user_meta_data ->> 'avatar_url', 'user')
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO existing FROM public.profiles WHERE user_id = uid;
  RETURN existing;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;
