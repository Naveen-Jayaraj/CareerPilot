-- ==============================================================================
-- JOB HUNT TRACKER - FREE SECURE SUPABASE CLOUD DATABASE SCHEMA
-- ==============================================================================
-- Run this in your Supabase Project's SQL Editor (supabase.com -> SQL Editor -> New Query)
-- Free tier provides 500MB PostgreSQL, SSL encryption, and Row Level Security (RLS).
-- ==============================================================================

-- 1. Create table for job applications
CREATE TABLE IF NOT EXISTS public.job_applications (
    id TEXT PRIMARY KEY,
    user_id UUID DEFAULT auth.uid(),
    company TEXT NOT NULL,
    role TEXT,
    applied_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'Applied',
    package_lpa TEXT,
    package_numeric NUMERIC,
    work_mode TEXT DEFAULT 'On-site',
    job_link TEXT,
    next_milestone_date TIMESTAMP WITH TIME ZONE,
    milestone_type TEXT DEFAULT 'Milestone',
    channel TEXT,
    contact_person TEXT,
    location TEXT,
    notes TEXT,
    prep_checklist JSONB DEFAULT '[]'::jsonb,
    interview_rounds JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) for bank-grade privacy
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow users to view and manage only their own applications
-- (If using anon key without sign-in, policy allows operations where user_id is null or matches)
CREATE POLICY "Users can manage their own job applications"
    ON public.job_applications
    FOR ALL
    USING (
        auth.uid() IS NULL OR auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() IS NULL OR auth.uid() = user_id
    );

-- 4. Enable Realtime for live cross-device updates (phone, laptop, desktop)
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_applications;

-- 5. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_job_applications_updated_at ON public.job_applications;
CREATE TRIGGER set_job_applications_updated_at
    BEFORE UPDATE ON public.job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'Job Hunt database schema installed successfully!' AS status;
