-- Create mentor applications table
CREATE TABLE public.mentor_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    bio TEXT NOT NULL,
    expertise_areas TEXT[] NOT NULL,
    years_experience INTEGER NOT NULL,
    linkedin_url TEXT,
    portfolio_url TEXT,
    reason_to_teach TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentor_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit applications
CREATE POLICY "Anyone can submit mentor applications"
ON public.mentor_applications
FOR INSERT
WITH CHECK (true);

-- Users can view their own applications
CREATE POLICY "Users can view their own applications"
ON public.mentor_applications
FOR SELECT
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_mentor_applications_updated_at
    BEFORE UPDATE ON public.mentor_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();