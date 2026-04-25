-- Function to look up an email by username, used for username-based login.
-- Runs as SECURITY DEFINER to safely access auth.users without exposing it via RLS.
CREATE OR REPLACE FUNCTION public.get_email_for_username(_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE lower(p.username) = lower(_username)
  LIMIT 1
$$;

-- Allow anonymous and authenticated users to call it (needed at login time).
GRANT EXECUTE ON FUNCTION public.get_email_for_username(text) TO anon, authenticated;