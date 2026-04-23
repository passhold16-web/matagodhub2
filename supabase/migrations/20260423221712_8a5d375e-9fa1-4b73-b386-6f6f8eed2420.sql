-- Rename duplicate username to free up the canonical one
UPDATE public.profiles
SET username = 'MataGod2'
WHERE user_id = '5ec1aa25-cd81-4de3-87ae-475b7cd25d7e';

-- Enforce case-insensitive uniqueness on username going forward
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (lower(username));