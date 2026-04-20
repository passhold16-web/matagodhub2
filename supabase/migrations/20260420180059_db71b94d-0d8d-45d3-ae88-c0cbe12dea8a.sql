-- 1. Unique constraint to ensure one vote per (user, build)
ALTER TABLE public.votes
  DROP CONSTRAINT IF EXISTS votes_user_build_unique;
ALTER TABLE public.votes
  ADD CONSTRAINT votes_user_build_unique UNIQUE (user_id, build_id);

-- 2. Trigger function to keep builds.votes_count in sync
CREATE OR REPLACE FUNCTION public.sync_build_votes_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.builds
      SET votes_count = votes_count + 1
      WHERE id = NEW.build_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.builds
      SET votes_count = GREATEST(0, votes_count - 1)
      WHERE id = OLD.build_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_votes_sync_insert ON public.votes;
CREATE TRIGGER trg_votes_sync_insert
  AFTER INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.sync_build_votes_count();

DROP TRIGGER IF EXISTS trg_votes_sync_delete ON public.votes;
CREATE TRIGGER trg_votes_sync_delete
  AFTER DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.sync_build_votes_count();

-- 3. Recalculate counts for existing builds
UPDATE public.builds b
  SET votes_count = COALESCE(sub.cnt, 0)
  FROM (
    SELECT build_id, COUNT(*)::int AS cnt
    FROM public.votes
    GROUP BY build_id
  ) sub
  WHERE b.id = sub.build_id;

UPDATE public.builds
  SET votes_count = 0
  WHERE id NOT IN (SELECT DISTINCT build_id FROM public.votes);

-- 4. Re-attach validate_build trigger (was missing) and allow optional `ability` in team_data
DROP TRIGGER IF EXISTS trg_validate_build ON public.builds;
CREATE TRIGGER trg_validate_build
  BEFORE INSERT OR UPDATE ON public.builds
  FOR EACH ROW EXECUTE FUNCTION public.validate_build();

-- 5. Realtime support for votes and builds
ALTER TABLE public.votes REPLICA IDENTITY FULL;
ALTER TABLE public.builds REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'votes'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.votes';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'builds'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.builds';
  END IF;
END $$;