-- Add ban status columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_banned boolean NOT NULL DEFAULT false,
ADD COLUMN banned_at timestamp with time zone,
ADD COLUMN ban_reason text;