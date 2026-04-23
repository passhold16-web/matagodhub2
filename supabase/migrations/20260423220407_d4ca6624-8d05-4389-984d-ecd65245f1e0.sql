-- Direct messages table
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_dm_pair ON public.direct_messages (sender_id, receiver_id, created_at DESC);
CREATE INDEX idx_dm_receiver ON public.direct_messages (receiver_id, created_at DESC);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Only sender and receiver can view their messages
CREATE POLICY "Participants can view their DMs"
ON public.direct_messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Authenticated users can send messages (must be themselves as sender, can't DM themselves)
CREATE POLICY "Users can send messages as themselves"
ON public.direct_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id AND sender_id <> receiver_id);

-- Sender can delete their own messages
CREATE POLICY "Senders can delete own messages"
ON public.direct_messages
FOR DELETE
USING (auth.uid() = sender_id);

-- Receiver can update (mark as read)
CREATE POLICY "Receiver can mark as read"
ON public.direct_messages
FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- Realtime
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;