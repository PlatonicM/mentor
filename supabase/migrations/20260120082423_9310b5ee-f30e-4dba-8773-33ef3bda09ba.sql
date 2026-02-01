-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Allow system to insert notifications (via service role or triggers)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to notify on event registration
CREATE OR REPLACE FUNCTION public.notify_event_registration()
RETURNS TRIGGER AS $$
DECLARE
  event_record RECORD;
  mentor_name TEXT;
BEGIN
  -- Get event details
  SELECT le.*, p.full_name INTO event_record
  FROM public.live_events le
  LEFT JOIN public.profiles p ON le.mentor_id = p.user_id
  WHERE le.id = NEW.event_id;

  mentor_name := COALESCE(event_record.full_name, 'Mentor');

  -- Notify user on registration
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      'Event Registration Pending',
      'Your registration for "' || event_record.title || '" is pending approval.',
      'event',
      '/events'
    );
  ELSIF NEW.status = 'accepted' AND (OLD IS NULL OR OLD.status != 'accepted') THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      'Registration Accepted!',
      'You are confirmed for "' || event_record.title || '" with ' || mentor_name || '.',
      'success',
      '/events'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for event registration notifications
CREATE TRIGGER on_event_participant_change
AFTER INSERT OR UPDATE ON public.event_participants
FOR EACH ROW
EXECUTE FUNCTION public.notify_event_registration();

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);