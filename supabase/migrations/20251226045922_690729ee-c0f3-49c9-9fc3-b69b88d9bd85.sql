-- Add policy to allow public viewing of mentor profiles
CREATE POLICY "Anyone can view mentor profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = profiles.user_id
    AND user_roles.role = 'mentor'
  )
);