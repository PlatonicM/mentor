-- Add columns to track reminder notifications sent
ALTER TABLE public.event_participants 
ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN DEFAULT FALSE;

-- Create index for efficient reminder queries
CREATE INDEX IF NOT EXISTS idx_event_participants_reminders 
ON public.event_participants(reminder_24h_sent, reminder_1h_sent) 
WHERE status = 'accepted';