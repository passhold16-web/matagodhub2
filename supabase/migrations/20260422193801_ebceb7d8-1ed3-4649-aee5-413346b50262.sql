-- Update allowed tiers: add VGC, remove LC
CREATE OR REPLACE FUNCTION public.validate_build()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  member jsonb;
  ev_total int;
BEGIN
  IF NEW.tier NOT IN ('OU','UU','NU','VGC') THEN
    RAISE EXCEPTION 'Invalid tier: %', NEW.tier;
  END IF;

  IF length(trim(NEW.name)) = 0 THEN
    RAISE EXCEPTION 'Build name cannot be empty';
  END IF;

  IF array_length(NEW.pokemon_ids, 1) IS DISTINCT FROM 6 THEN
    RAISE EXCEPTION 'A build must contain exactly 6 Pokémon';
  END IF;

  IF NEW.team_data IS NOT NULL THEN
    IF jsonb_typeof(NEW.team_data) <> 'array' THEN
      RAISE EXCEPTION 'team_data must be a JSON array';
    END IF;

    IF jsonb_array_length(NEW.team_data) <> 6 THEN
      RAISE EXCEPTION 'team_data must contain exactly 6 entries';
    END IF;

    FOR member IN SELECT * FROM jsonb_array_elements(NEW.team_data)
    LOOP
      ev_total := COALESCE((member->'evs'->>'hp')::int,0)
                + COALESCE((member->'evs'->>'atk')::int,0)
                + COALESCE((member->'evs'->>'def')::int,0)
                + COALESCE((member->'evs'->>'spa')::int,0)
                + COALESCE((member->'evs'->>'spd')::int,0)
                + COALESCE((member->'evs'->>'spe')::int,0);
      IF ev_total > 510 THEN
        RAISE EXCEPTION 'EV total per Pokémon cannot exceed 510 (got %)', ev_total;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;

-- Tournament registrations (posts)
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, user_id)
);

ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Registrations are viewable by everyone"
  ON public.tournament_registrations FOR SELECT USING (true);

CREATE POLICY "Users can register themselves"
  ON public.tournament_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their registration"
  ON public.tournament_registrations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users or staff can delete registration"
  ON public.tournament_registrations FOR DELETE
  USING (auth.uid() = user_id OR has_app_role(auth.uid(), 'admin') OR has_app_role(auth.uid(), 'mod'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_registrations;