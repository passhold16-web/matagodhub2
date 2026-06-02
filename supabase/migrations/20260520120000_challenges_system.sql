-- MataGodHub: competitive challenges, ranking stats, disputes

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS losses integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pokemmo_nick text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_wins_non_negative CHECK (wins >= 0),
  ADD CONSTRAINT profiles_losses_non_negative CHECK (losses >= 0);

-- ============ Challenges ============
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL,
  opponent_id uuid,
  format text NOT NULL,
  prize_pd bigint NOT NULL DEFAULT 0 CHECK (prize_pd >= 0),
  status text NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente', 'aceptado', 'completado', 'cancelado', 'disputa')),
  meet_day date,
  meet_time time,
  meet_timezone text,
  meet_channel text,
  meet_city text,
  meet_confirmed_at timestamptz,
  meet_at timestamptz,
  challenger_result_winner_id uuid,
  opponent_result_winner_id uuid,
  winner_id uuid,
  loser_id uuid,
  counts_for_ranking boolean NOT NULL DEFAULT true,
  dispute_reason text CHECK (dispute_reason IS NULL OR dispute_reason IN ('result_mismatch', 'non_payment')),
  dispute_proof_path text,
  dispute_reported_by uuid,
  dispute_resolved_at timestamptz,
  dispute_resolved_by uuid,
  cancelled_by uuid,
  cancel_reason text,
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT challenges_format_check CHECK (format IN ('OU', 'UU', 'NU', 'LC', 'Doubles')),
  CONSTRAINT challenges_players_distinct CHECK (
    opponent_id IS NULL OR challenger_id <> opponent_id
  )
);

CREATE INDEX idx_challenges_status ON public.challenges(status, created_at DESC);
CREATE INDEX idx_challenges_challenger ON public.challenges(challenger_id);
CREATE INDEX idx_challenges_opponent ON public.challenges(opponent_id);
CREATE INDEX idx_challenges_meet_at ON public.challenges(meet_at) WHERE meet_at IS NOT NULL;

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Challenge chat ============
CREATE TABLE public.challenge_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(trim(content)) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_challenge_messages_challenge ON public.challenge_messages(challenge_id, created_at);

-- ============ Helpers ============
CREATE OR REPLACE FUNCTION public.challenge_participant_ids(c public.challenges)
RETURNS uuid[]
LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY[c.challenger_id, c.opponent_id]::uuid[];
$$;

CREATE OR REPLACE FUNCTION public.is_challenge_participant(c public.challenges, uid uuid)
RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT uid = c.challenger_id OR uid = c.opponent_id;
$$;

CREATE OR REPLACE FUNCTION public.scored_challenges_today_between(u1 uuid, u2 uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::integer
  FROM public.challenges c
  WHERE c.status = 'completado'
    AND c.counts_for_ranking = true
    AND c.completed_at >= date_trunc('day', now() AT TIME ZONE 'utc')
    AND c.completed_at < date_trunc('day', now() AT TIME ZONE 'utc') + interval '1 day'
    AND (
      (c.challenger_id = u1 AND c.opponent_id = u2)
      OR (c.challenger_id = u2 AND c.opponent_id = u1)
    );
$$;

CREATE OR REPLACE FUNCTION public.apply_challenge_outcome(
  p_challenge_id uuid,
  p_winner_id uuid,
  p_counts_for_ranking boolean
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.challenges;
  v_loser uuid;
BEGIN
  SELECT * INTO c FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Challenge not found'; END IF;

  IF c.status NOT IN ('aceptado', 'disputa') THEN
    RAISE EXCEPTION 'Challenge cannot be resolved in status %', c.status;
  END IF;

  IF p_winner_id NOT IN (c.challenger_id, c.opponent_id) THEN
    RAISE EXCEPTION 'Winner must be a participant';
  END IF;

  v_loser := CASE WHEN p_winner_id = c.challenger_id THEN c.opponent_id ELSE c.challenger_id END;

  UPDATE public.challenges SET
    status = 'completado',
    winner_id = p_winner_id,
    loser_id = v_loser,
    counts_for_ranking = p_counts_for_ranking,
    completed_at = now(),
    updated_at = now()
  WHERE id = p_challenge_id;

  IF p_counts_for_ranking THEN
    UPDATE public.profiles SET wins = wins + 1, updated_at = now() WHERE user_id = p_winner_id;
    UPDATE public.profiles SET losses = losses + 1, updated_at = now() WHERE user_id = v_loser;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_dispute_proof_storage(p_path text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_path IS NOT NULL AND length(trim(p_path)) > 0 THEN
    DELETE FROM storage.objects
    WHERE bucket_id = 'challenge-proofs' AND name = p_path;
  END IF;
END;
$$;

-- ============ RPC: Accept ============
CREATE OR REPLACE FUNCTION public.accept_challenge(p_challenge_id uuid)
RETURNS public.challenges
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.challenges;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF public.is_banned(uid) THEN RAISE EXCEPTION 'User is banned'; END IF;

  SELECT * INTO c FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Challenge not found'; END IF;
  IF c.status <> 'pendiente' THEN RAISE EXCEPTION 'Challenge is not pending'; END IF;
  IF uid = c.challenger_id THEN RAISE EXCEPTION 'Cannot accept your own challenge'; END IF;

  IF c.opponent_id IS NOT NULL AND uid <> c.opponent_id THEN
    RAISE EXCEPTION 'This challenge is for another player';
  END IF;

  UPDATE public.challenges SET
    status = 'aceptado',
    opponent_id = COALESCE(c.opponent_id, uid),
    accepted_at = now(),
    updated_at = now()
  WHERE id = p_challenge_id
  RETURNING * INTO c;

  RETURN c;
END;
$$;

-- ============ RPC: Confirm meet ============
CREATE OR REPLACE FUNCTION public.confirm_challenge_meet(
  p_challenge_id uuid,
  p_meet_day date,
  p_meet_time time,
  p_meet_timezone text,
  p_meet_channel text,
  p_meet_city text
)
RETURNS public.challenges
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.challenges;
  uid uuid := auth.uid();
  v_meet_at timestamptz;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO c FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Challenge not found'; END IF;
  IF c.status <> 'aceptado' THEN RAISE EXCEPTION 'Challenge must be accepted first'; END IF;
  IF NOT public.is_challenge_participant(c, uid) THEN RAISE EXCEPTION 'Not a participant'; END IF;

  IF p_meet_day IS NULL OR p_meet_time IS NULL OR trim(p_meet_timezone) = '' OR trim(p_meet_channel) = '' OR trim(p_meet_city) = '' THEN
    RAISE EXCEPTION 'All meet fields are required';
  END IF;

  v_meet_at := (p_meet_day::text || ' ' || p_meet_time::text)::timestamp AT TIME ZONE 'UTC';

  UPDATE public.challenges SET
    meet_day = p_meet_day,
    meet_time = p_meet_time,
    meet_timezone = trim(p_meet_timezone),
    meet_channel = trim(p_meet_channel),
    meet_city = trim(p_meet_city),
    meet_confirmed_at = now(),
    meet_at = v_meet_at,
    updated_at = now()
  WHERE id = p_challenge_id
  RETURNING * INTO c;

  RETURN c;
END;
$$;

-- ============ RPC: Cancel inactivity (creator, 24h after accept, no meet) ============
CREATE OR REPLACE FUNCTION public.cancel_challenge_inactivity(p_challenge_id uuid)
RETURNS public.challenges
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.challenges;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO c FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Challenge not found'; END IF;
  IF uid <> c.challenger_id THEN RAISE EXCEPTION 'Only the challenger can cancel for inactivity'; END IF;
  IF c.status <> 'aceptado' THEN RAISE EXCEPTION 'Challenge must be accepted'; END IF;
  IF c.meet_confirmed_at IS NOT NULL THEN RAISE EXCEPTION 'Meet already confirmed'; END IF;
  IF c.accepted_at IS NULL OR c.accepted_at > now() - interval '24 hours' THEN
    RAISE EXCEPTION 'Must wait 24 hours after acceptance';
  END IF;

  UPDATE public.challenges SET
    status = 'cancelado',
    cancelled_by = uid,
    cancel_reason = 'inactivity',
    updated_at = now()
  WHERE id = p_challenge_id
  RETURNING * INTO c;

  RETURN c;
END;
$$;

-- ============ RPC: Report result ============
CREATE OR REPLACE FUNCTION public.report_challenge_result(
  p_challenge_id uuid,
  p_winner_id uuid
)
RETURNS public.challenges
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.challenges;
  uid uuid := auth.uid();
  v_other_winner uuid;
  v_counts boolean;
  v_today integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF public.is_banned(uid) THEN RAISE EXCEPTION 'User is banned'; END IF;

  SELECT * INTO c FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Challenge not found'; END IF;
  IF c.status <> 'aceptado' THEN RAISE EXCEPTION 'Challenge not in progress'; END IF;
  IF NOT public.is_challenge_participant(c, uid) THEN RAISE EXCEPTION 'Not a participant'; END IF;
  IF c.meet_at IS NULL OR now() < c.meet_at THEN
    RAISE EXCEPTION 'Cannot report before scheduled battle time';
  END IF;
  IF p_winner_id NOT IN (c.challenger_id, c.opponent_id) THEN
    RAISE EXCEPTION 'Invalid winner';
  END IF;

  IF uid = c.challenger_id THEN
    UPDATE public.challenges SET challenger_result_winner_id = p_winner_id, updated_at = now()
    WHERE id = p_challenge_id RETURNING * INTO c;
  ELSE
    UPDATE public.challenges SET opponent_result_winner_id = p_winner_id, updated_at = now()
    WHERE id = p_challenge_id RETURNING * INTO c;
  END IF;

  IF c.challenger_result_winner_id IS NULL OR c.opponent_result_winner_id IS NULL THEN
    RETURN c;
  END IF;

  IF c.challenger_result_winner_id <> c.opponent_result_winner_id THEN
    UPDATE public.challenges SET
      status = 'disputa',
      dispute_reason = 'result_mismatch',
      updated_at = now()
    WHERE id = p_challenge_id
    RETURNING * INTO c;
    RETURN c;
  END IF;

  v_other_winner := c.challenger_result_winner_id;
  v_today := public.scored_challenges_today_between(c.challenger_id, c.opponent_id);
  v_counts := v_today < 2;

  PERFORM public.apply_challenge_outcome(p_challenge_id, v_other_winner, v_counts);
  SELECT * INTO c FROM public.challenges WHERE id = p_challenge_id;
  RETURN c;
END;
$$;

-- ============ RPC: Open payment dispute ============
CREATE OR REPLACE FUNCTION public.open_challenge_dispute(
  p_challenge_id uuid,
  p_reason text,
  p_proof_path text
)
RETURNS public.challenges
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.challenges;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_reason NOT IN ('result_mismatch', 'non_payment') THEN
    RAISE EXCEPTION 'Invalid dispute reason';
  END IF;

  SELECT * INTO c FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Challenge not found'; END IF;
  IF NOT public.is_challenge_participant(c, uid) THEN RAISE EXCEPTION 'Not a participant'; END IF;
  IF c.status NOT IN ('aceptado', 'disputa') THEN RAISE EXCEPTION 'Cannot dispute now'; END IF;

  UPDATE public.challenges SET
    status = 'disputa',
    dispute_reason = p_reason,
    dispute_proof_path = NULLIF(trim(p_proof_path), ''),
    dispute_reported_by = uid,
    updated_at = now()
  WHERE id = p_challenge_id
  RETURNING * INTO c;

  RETURN c;
END;
$$;

-- ============ RPC: Staff resolve dispute ============
CREATE OR REPLACE FUNCTION public.resolve_challenge_dispute(
  p_challenge_id uuid,
  p_winner_id uuid,
  p_counts_for_ranking boolean DEFAULT true
)
RETURNS public.challenges
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.challenges;
  v_path text;
  v_today integer;
  v_counts boolean;
BEGIN
  IF NOT (public.has_app_role(auth.uid(), 'admin') OR public.has_app_role(auth.uid(), 'mod')) THEN
    RAISE EXCEPTION 'Staff only';
  END IF;

  SELECT * INTO c FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Challenge not found'; END IF;
  IF c.status <> 'disputa' THEN RAISE EXCEPTION 'Challenge is not in dispute'; END IF;

  v_path := c.dispute_proof_path;
  v_today := public.scored_challenges_today_between(c.challenger_id, c.opponent_id);
  v_counts := p_counts_for_ranking AND v_today < 2;

  PERFORM public.apply_challenge_outcome(p_challenge_id, p_winner_id, v_counts);

  UPDATE public.challenges SET
    dispute_resolved_at = now(),
    dispute_resolved_by = auth.uid(),
    updated_at = now()
  WHERE id = p_challenge_id;

  PERFORM public.delete_dispute_proof_storage(v_path);

  SELECT * INTO c FROM public.challenges WHERE id = p_challenge_id;
  RETURN c;
END;
$$;

-- ============ RLS challenges ============
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenges viewable by authenticated"
  ON public.challenges FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create challenges"
  ON public.challenges FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = challenger_id AND NOT public.is_banned(auth.uid()));

CREATE POLICY "Participants can update challenges"
  ON public.challenges FOR UPDATE TO authenticated
  USING (public.is_challenge_participant(challenges, auth.uid()));

CREATE POLICY "Staff can update any challenge"
  ON public.challenges FOR UPDATE TO authenticated
  USING (
    public.has_app_role(auth.uid(), 'admin') OR public.has_app_role(auth.uid(), 'mod')
  );

-- ============ RLS messages ============
ALTER TABLE public.challenge_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenge messages viewable by participants"
  ON public.challenge_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id
        AND public.is_challenge_participant(c, auth.uid())
    )
  );

CREATE POLICY "Participants can send challenge messages"
  ON public.challenge_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT public.is_banned(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id
        AND c.status = 'aceptado'
        AND public.is_challenge_participant(c, auth.uid())
    )
  );

-- ============ Storage: dispute proofs ============
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'challenge-proofs',
  'challenge-proofs',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg'];

CREATE POLICY "Participants upload dispute proof"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'challenge-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Staff read dispute proofs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'challenge-proofs'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_app_role(auth.uid(), 'admin')
      OR public.has_app_role(auth.uid(), 'mod')
    )
  );

CREATE POLICY "Staff delete dispute proofs"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'challenge-proofs'
    AND (
      public.has_app_role(auth.uid(), 'admin')
      OR public.has_app_role(auth.uid(), 'mod')
    )
  );

-- ============ Grants ============
GRANT EXECUTE ON FUNCTION public.accept_challenge(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_challenge_meet(uuid, date, time, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_challenge_inactivity(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_challenge_result(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.open_challenge_dispute(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_challenge_dispute(uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.scored_challenges_today_between(uuid, uuid) TO authenticated;

DROP TRIGGER IF EXISTS block_banned_challenges ON public.challenges;
CREATE TRIGGER block_banned_challenges
  BEFORE INSERT ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_insert();

DROP TRIGGER IF EXISTS block_banned_challenge_messages ON public.challenge_messages;
CREATE TRIGGER block_banned_challenge_messages
  BEFORE INSERT ON public.challenge_messages
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_insert();
