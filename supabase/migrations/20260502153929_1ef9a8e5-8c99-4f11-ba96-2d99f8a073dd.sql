
-- 1. Tabla de baneos
CREATE TABLE IF NOT EXISTS public.banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  banned_by uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bans viewable by everyone"
  ON public.banned_users FOR SELECT USING (true);

CREATE POLICY "Only staff can ban"
  ON public.banned_users FOR INSERT
  WITH CHECK (
    public.has_app_role(auth.uid(), 'admin')
    OR public.has_app_role(auth.uid(), 'mod')
  );

CREATE POLICY "Only admin can unban"
  ON public.banned_users FOR DELETE
  USING (public.has_app_role(auth.uid(), 'admin'));

-- 2. Helper is_banned
CREATE OR REPLACE FUNCTION public.is_banned(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.banned_users WHERE user_id = _user_id)
$$;

-- 3. Bloquear baneados de publicar (chat, foro, builds, dm, torneos, registros)
CREATE OR REPLACE FUNCTION public.block_banned_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.is_banned(auth.uid()) THEN
    RAISE EXCEPTION 'User is banned and cannot perform this action';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_banned_chat ON public.chat_messages;
CREATE TRIGGER block_banned_chat BEFORE INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_insert();

DROP TRIGGER IF EXISTS block_banned_forum_post ON public.forum_posts;
CREATE TRIGGER block_banned_forum_post BEFORE INSERT ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_insert();

DROP TRIGGER IF EXISTS block_banned_forum_comment ON public.forum_comments;
CREATE TRIGGER block_banned_forum_comment BEFORE INSERT ON public.forum_comments
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_insert();

DROP TRIGGER IF EXISTS block_banned_builds ON public.builds;
CREATE TRIGGER block_banned_builds BEFORE INSERT ON public.builds
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_insert();

DROP TRIGGER IF EXISTS block_banned_dm ON public.direct_messages;
CREATE TRIGGER block_banned_dm BEFORE INSERT ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_insert();

DROP TRIGGER IF EXISTS block_banned_tournaments ON public.tournaments;
CREATE TRIGGER block_banned_tournaments BEFORE INSERT ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_insert();

DROP TRIGGER IF EXISTS block_banned_registrations ON public.tournament_registrations;
CREATE TRIGGER block_banned_registrations BEFORE INSERT ON public.tournament_registrations
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_insert();

-- 4. Permitir a admin/mod borrar contenido (builds, votes, registros, torneos, DM no — privacidad)
DROP POLICY IF EXISTS "Staff can delete any build" ON public.builds;
CREATE POLICY "Staff can delete any build"
  ON public.builds FOR DELETE
  USING (public.has_app_role(auth.uid(), 'admin') OR public.has_app_role(auth.uid(), 'mod'));

DROP POLICY IF EXISTS "Staff can delete any tournament" ON public.tournaments;
CREATE POLICY "Staff can delete any tournament"
  ON public.tournaments FOR DELETE
  USING (public.has_app_role(auth.uid(), 'admin') OR public.has_app_role(auth.uid(), 'mod'));

-- 5. Solo admin puede cambiar roles (vía función SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.set_user_role(_user_id uuid, _role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_app_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change roles';
  END IF;
  IF _role NOT IN ('user','mod','admin','youtuber') THEN
    RAISE EXCEPTION 'Invalid role: %', _role;
  END IF;
  UPDATE public.profiles SET role = _role, updated_at = now() WHERE user_id = _user_id;
END;
$$;

-- 6. Auto-promover el username "Admin" al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uname text;
  urole text := 'user';
BEGIN
  uname := COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1));
  INSERT INTO public.profiles (user_id, username, avatar_url, role)
  VALUES (NEW.id, uname, NEW.raw_user_meta_data ->> 'avatar_url', 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
