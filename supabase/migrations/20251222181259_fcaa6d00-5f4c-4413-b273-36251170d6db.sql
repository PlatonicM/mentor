-- Create earnings/transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    platform_fee NUMERIC NOT NULL DEFAULT 0,
    net_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Mentors can view their own transactions
CREATE POLICY "Mentors can view their own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = mentor_id);

-- System can create transactions
CREATE POLICY "System can create transactions"
ON public.transactions FOR INSERT
WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX idx_transactions_mentor_id ON public.transactions(mentor_id);
CREATE INDEX idx_transactions_course_id ON public.transactions(course_id);
CREATE INDEX idx_enrollments_course_id ON public.enrollments(course_id);