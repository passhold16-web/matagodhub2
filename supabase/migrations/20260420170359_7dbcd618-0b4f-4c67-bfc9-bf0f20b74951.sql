-- Función timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BUILDS
CREATE TABLE public.builds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('OU','UU','NU','LC')),
  description TEXT,
  pokemon_ids INTEGER[] NOT NULL CHECK (array_length(pokemon_ids,1) = 6),
  votes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.builds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Builds are viewable by everyone"
  ON public.builds FOR SELECT USING (true);
CREATE POLICY "Users can insert their own builds"
  ON public.builds FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own builds"
  ON public.builds FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own builds"
  ON public.builds FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_builds_updated_at
  BEFORE UPDATE ON public.builds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_builds_tier ON public.builds(tier);
CREATE INDEX idx_builds_user ON public.builds(user_id);

-- VOTES
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  build_id UUID NOT NULL REFERENCES public.builds(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, build_id)
);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are viewable by everyone"
  ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own votes"
  ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own votes"
  ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- CHAT MESSAGES
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat messages are viewable by everyone"
  ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can insert their own messages"
  ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own messages"
  ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_chat_created ON public.chat_messages(created_at DESC);