-- Pre-launch security hardening

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
  IF lower(candidate) = 'admin' THEN
    candidate := 'trainer';
  END IF;
  WHILE EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(candidate) AND user_id IS DISTINCT FROM uid
  ) LOOP
    n := n + 1;
    candidate := left(trim(base), 16) || '_' || substr(replace(uid::text, '-', ''), 1, 6)
      || CASE WHEN n > 1 THEN n::text ELSE '' END;
  END LOOP;
  RETURN candidate;
END;
$$;

-- 1) Prevent users from changing their own role (only admins via set_user_role)
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL AND auth.uid() = NEW.user_id THEN
      NEW.role := 'user';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      IF NOT public.has_app_role(auth.uid(), 'admin') THEN
        NEW.role := OLD.role;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role_trigger ON public.profiles;
CREATE TRIGGER protect_profile_role_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- 2) Signup trigger: no auto-admin; unique usernames
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uname text;
BEGIN
  uname := COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1));
  uname := public.unique_username(uname, NEW.id);

  INSERT INTO public.profiles (user_id, username, avatar_url, role)
  VALUES (NEW.id, uname, NEW.raw_user_meta_data ->> 'avatar_url', 'user')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3) Builds & forum: members-only read (matches login wall in the app)
DROP POLICY IF EXISTS "Builds are viewable by everyone" ON public.builds;
CREATE POLICY "Builds viewable by authenticated users"
  ON public.builds FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Forum posts are viewable by everyone" ON public.forum_posts;
CREATE POLICY "Forum posts viewable by authenticated users"
  ON public.forum_posts FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Forum comments are viewable by everyone" ON public.forum_comments;
CREATE POLICY "Forum comments viewable by authenticated users"
  ON public.forum_comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.forum_likes;
CREATE POLICY "Forum likes viewable by authenticated users"
  ON public.forum_likes FOR SELECT
  TO authenticated
  USING (true);

-- 4) Ban list: staff only
DROP POLICY IF EXISTS "Bans viewable by everyone" ON public.banned_users;
CREATE POLICY "Bans viewable by staff"
  ON public.banned_users FOR SELECT
  USING (
    public.has_app_role(auth.uid(), 'admin')
    OR public.has_app_role(auth.uid(), 'mod')
  );

-- 5) Block banned users on UPDATE (not only INSERT)
CREATE OR REPLACE FUNCTION public.block_banned_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_banned(auth.uid()) THEN
    RAISE EXCEPTION 'User is banned and cannot perform this action';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_banned_builds_update ON public.builds;
CREATE TRIGGER block_banned_builds_update
  BEFORE UPDATE ON public.builds
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_mutation();

DROP TRIGGER IF EXISTS block_banned_forum_post_update ON public.forum_posts;
CREATE TRIGGER block_banned_forum_post_update
  BEFORE UPDATE ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_mutation();

DROP TRIGGER IF EXISTS block_banned_forum_comment_update ON public.forum_comments;
CREATE TRIGGER block_banned_forum_comment_update
  BEFORE UPDATE ON public.forum_comments
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_mutation();

-- 6) Server-side profile fallback (used by the app)
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
