-- Add JSONB column for full technical team data
ALTER TABLE public.builds
ADD COLUMN IF NOT EXISTS team_data jsonb;

-- Drop strict 6-pokemon validator (replaced by team_data validator)
DROP TRIGGER IF EXISTS validate_build_trigger ON public.builds;

-- New validator: team_data must be an array of 6 entries when present, EV total ≤ 510
CREATE OR REPLACE FUNCTION public.validate_build()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  member jsonb;
  ev_total int;
BEGIN
  IF NEW.tier NOT IN ('OU','UU','NU','LC') THEN
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
$$;

CREATE TRIGGER validate_build_trigger
BEFORE INSERT OR UPDATE ON public.builds
FOR EACH ROW
EXECUTE FUNCTION public.validate_build();