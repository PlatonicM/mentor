-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_event_registration BOOLEAN NOT NULL DEFAULT true,
  email_event_reminder_24h BOOLEAN NOT NULL DEFAULT true,
  email_event_reminder_1h BOOLEAN NOT NULL DEFAULT true,
  email_course_updates BOOLEAN NOT NULL DEFAULT true,
  email_marketing BOOLEAN NOT NULL DEFAULT false,
  push_event_reminder_24h BOOLEAN NOT NULL DEFAULT true,
  push_event_reminder_1h BOOLEAN NOT NULL DEFAULT true,
  push_course_updates BOOLEAN NOT NULL DEFAULT true,
  inapp_event_registration BOOLEAN NOT NULL DEFAULT true,
  inapp_event_reminder_24h BOOLEAN NOT NULL DEFAULT true,
  inapp_event_reminder_1h BOOLEAN NOT NULL DEFAULT true,
  inapp_course_updates BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view their own preferences"
ON public.notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own preferences"
ON public.notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own preferences"
ON public.notification_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();