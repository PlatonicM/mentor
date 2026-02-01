-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to call the edge function
CREATE OR REPLACE FUNCTION public.trigger_event_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Get the Supabase URL from environment
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Use pg_net to call the edge function
  PERFORM net.http_post(
    url := 'https://elegpayedzswsixrrgmt.supabase.co/functions/v1/send-event-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWdwYXllZHpzd3NpeHJyZ210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDE4ODcsImV4cCI6MjA4MTgxNzg4N30.Qok8HA8jmL1iuDtPWjQzoWZzdpsUFR9WI_KhXxvuATk'
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Schedule the cron job to run every 30 minutes
SELECT cron.schedule(
  'send-event-reminders',
  '*/30 * * * *',
  $$SELECT public.trigger_event_reminders()$$
);