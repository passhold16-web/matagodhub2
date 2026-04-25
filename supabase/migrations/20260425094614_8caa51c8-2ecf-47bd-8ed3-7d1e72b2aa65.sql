-- Add pokemmo_nick to tournament_registrations
ALTER TABLE public.tournament_registrations
  ADD COLUMN IF NOT EXISTS pokemmo_nick text;

-- Backfill any existing rows so we can enforce NOT NULL
UPDATE public.tournament_registrations
   SET pokemmo_nick = 'unknown'
 WHERE pokemmo_nick IS NULL;

ALTER TABLE public.tournament_registrations
  ALTER COLUMN pokemmo_nick SET NOT NULL;

-- Length sanity check
ALTER TABLE public.tournament_registrations
  ADD CONSTRAINT tournament_registrations_pokemmo_nick_len
  CHECK (char_length(pokemmo_nick) BETWEEN 1 AND 32);