CREATE TABLE public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published news viewable by everyone"
ON public.news FOR SELECT
USING (published = true OR has_app_role(auth.uid(),'admin') OR has_app_role(auth.uid(),'mod'));

CREATE POLICY "Staff can insert news"
ON public.news FOR INSERT
WITH CHECK ((has_app_role(auth.uid(),'admin') OR has_app_role(auth.uid(),'mod')) AND auth.uid() = user_id);

CREATE POLICY "Staff can update news"
ON public.news FOR UPDATE
USING (has_app_role(auth.uid(),'admin') OR has_app_role(auth.uid(),'mod'))
WITH CHECK (has_app_role(auth.uid(),'admin') OR has_app_role(auth.uid(),'mod'));

CREATE POLICY "Staff can delete news"
ON public.news FOR DELETE
USING (has_app_role(auth.uid(),'admin') OR has_app_role(auth.uid(),'mod'));

CREATE TRIGGER update_news_updated_at
BEFORE UPDATE ON public.news
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_news_created_at ON public.news (created_at DESC);
CREATE INDEX idx_news_pinned ON public.news (pinned DESC, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.news;