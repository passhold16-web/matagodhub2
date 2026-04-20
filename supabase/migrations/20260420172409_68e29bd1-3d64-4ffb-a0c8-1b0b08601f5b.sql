-- Validate that a build always contains exactly 6 Pokémon and tier is one of the allowed values
CREATE OR REPLACE FUNCTION public.validate_build()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF array_length(NEW.pokemon_ids, 1) IS DISTINCT FROM 6 THEN
    RAISE EXCEPTION 'A build must contain exactly 6 Pokémon';
  END IF;
  IF NEW.tier NOT IN ('OU','UU','NU','LC') THEN
    RAISE EXCEPTION 'Invalid tier: %', NEW.tier;
  END IF;
  IF length(trim(NEW.name)) = 0 THEN
    RAISE EXCEPTION 'Build name cannot be empty';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_build_trigger ON public.builds;
CREATE TRIGGER validate_build_trigger
BEFORE INSERT OR UPDATE ON public.builds
FOR EACH ROW
EXECUTE FUNCTION public.validate_build();

-- Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS update_builds_updated_at ON public.builds;
CREATE TRIGGER update_builds_updated_at
BEFORE UPDATE ON public.builds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();