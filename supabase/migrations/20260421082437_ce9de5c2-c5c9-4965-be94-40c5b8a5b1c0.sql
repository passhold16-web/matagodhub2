-- ============================================================
-- Helper: security definer role check (used by mod policies)
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_app_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id
      AND lower(role) = lower(_role)
  )
$$;

-- ============================================================
-- Chat: allow admins/mods to delete any message
-- ============================================================
CREATE POLICY "Admins and mods can delete any message"
  ON public.chat_messages FOR DELETE
  USING (
    public.has_app_role(auth.uid(), 'admin')
    OR public.has_app_role(auth.uid(), 'mod')
  );

-- ============================================================
-- Forum categories (fixed enum)
-- ============================================================
CREATE TYPE public.forum_category AS ENUM ('estrategia', 'pve', 'eventos', 'offtopic');

-- ============================================================
-- Forum posts
-- ============================================================
CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category public.forum_category NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT forum_posts_title_len CHECK (char_length(title) BETWEEN 3 AND 120),
  CONSTRAINT forum_posts_content_len CHECK (char_length(content) BETWEEN 1 AND 5000)
);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Forum posts are viewable by everyone"
  ON public.forum_posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.forum_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own posts"
  ON public.forum_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owners or staff can delete posts"
  ON public.forum_posts FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.has_app_role(auth.uid(), 'admin')
    OR public.has_app_role(auth.uid(), 'mod')
  );

CREATE TRIGGER update_forum_posts_updated_at
  BEFORE UPDATE ON public.forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_forum_posts_category ON public.forum_posts(category, created_at DESC);
CREATE INDEX idx_forum_posts_user ON public.forum_posts(user_id);

-- ============================================================
-- Forum comments
-- ============================================================
CREATE TABLE public.forum_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT forum_comments_content_len CHECK (char_length(content) BETWEEN 1 AND 1500)
);

ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Forum comments are viewable by everyone"
  ON public.forum_comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.forum_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own comments"
  ON public.forum_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owners or staff can delete comments"
  ON public.forum_comments FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.has_app_role(auth.uid(), 'admin')
    OR public.has_app_role(auth.uid(), 'mod')
  );

CREATE INDEX idx_forum_comments_post ON public.forum_comments(post_id, created_at);

-- ============================================================
-- Forum likes (works for both posts and comments)
-- ============================================================
CREATE TABLE public.forum_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);

ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
  ON public.forum_likes FOR SELECT USING (true);

CREATE POLICY "Users can like as themselves"
  ON public.forum_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own likes"
  ON public.forum_likes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_forum_likes_target ON public.forum_likes(target_type, target_id);

-- ============================================================
-- Triggers: keep counters in sync
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_forum_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'post' THEN
      UPDATE public.forum_posts SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
    ELSE
      UPDATE public.forum_comments SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'post' THEN
      UPDATE public.forum_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.target_id;
    ELSE
      UPDATE public.forum_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.target_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_forum_likes_sync
  AFTER INSERT OR DELETE ON public.forum_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_forum_likes_count();

CREATE OR REPLACE FUNCTION public.sync_forum_comments_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_forum_comments_sync
  AFTER INSERT OR DELETE ON public.forum_comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_forum_comments_count();

-- ============================================================
-- Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_comments;