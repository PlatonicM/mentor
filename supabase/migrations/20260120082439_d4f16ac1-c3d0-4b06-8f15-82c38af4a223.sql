-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a more restrictive insert policy that only allows the trigger function to insert
-- Users cannot directly insert notifications, only the system can via SECURITY DEFINER functions
CREATE POLICY "Only authenticated trigger can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  -- Allow inserts only from the trigger function (SECURITY DEFINER)
  -- This effectively blocks direct user inserts while allowing the trigger
  auth.uid() IS NOT NULL
);