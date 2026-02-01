-- Create event type enum
CREATE TYPE public.event_type AS ENUM ('one_on_one', 'webinar');

-- Create event status enum  
CREATE TYPE public.event_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');

-- Create participant status enum
CREATE TYPE public.participant_status AS ENUM ('pending', 'accepted', 'declined');

-- Create live_events table
CREATE TABLE public.live_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_type event_type NOT NULL DEFAULT 'webinar',
    mentor_id UUID NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    meeting_link TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    max_participants INTEGER DEFAULT NULL,
    status event_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_participants table
CREATE TABLE public.event_participants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.live_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    status participant_status NOT NULL DEFAULT 'pending',
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for live_events
CREATE POLICY "Anyone can view scheduled events"
ON public.live_events
FOR SELECT
USING (status IN ('scheduled', 'live'));

CREATE POLICY "Mentors can create their own events"
ON public.live_events
FOR INSERT
WITH CHECK (auth.uid() = mentor_id AND has_role(auth.uid(), 'mentor'));

CREATE POLICY "Mentors can update their own events"
ON public.live_events
FOR UPDATE
USING (auth.uid() = mentor_id);

CREATE POLICY "Mentors can delete their own events"
ON public.live_events
FOR DELETE
USING (auth.uid() = mentor_id);

-- RLS policies for event_participants
CREATE POLICY "Users can view their own participation"
ON public.event_participants
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Mentors can view participants of their events"
ON public.event_participants
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.live_events
    WHERE live_events.id = event_participants.event_id
    AND live_events.mentor_id = auth.uid()
));

CREATE POLICY "Users can register for events"
ON public.event_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
ON public.event_participants
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Mentors can update participant status"
ON public.event_participants
FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.live_events
    WHERE live_events.id = event_participants.event_id
    AND live_events.mentor_id = auth.uid()
));

CREATE POLICY "Users can cancel their participation"
ON public.event_participants
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_live_events_updated_at
    BEFORE UPDATE ON public.live_events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_event_participants_updated_at
    BEFORE UPDATE ON public.event_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();