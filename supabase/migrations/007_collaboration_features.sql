
-- Support for collaborative planning and facilitation progress

-- Table for block-level comments/discussion
CREATE TABLE IF NOT EXISTS public.block_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    block_id UUID NOT NULL, -- Logical ID of the block within the session
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for comments
ALTER TABLE public.block_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments for sessions they can access"
    ON public.block_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.sessions s
            WHERE s.id = block_comments.session_id
            AND (s.profile_id = auth.uid() OR s.is_public = true)
        )
    );

CREATE POLICY "Users can add comments to accessible sessions"
    ON public.block_comments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sessions s
            WHERE s.id = block_comments.session_id
            AND (s.profile_id = auth.uid() OR s.is_public = true)
        )
    );

-- Table for facilitation progress logs
CREATE TABLE IF NOT EXISTS public.block_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    block_id UUID NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.block_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage logs for their sessions"
    ON public.block_logs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.sessions s
            WHERE s.id = block_logs.session_id
            AND (s.profile_id = auth.uid())
        )
    );

-- Table for session collaboration (sharing)
CREATE TABLE IF NOT EXISTS public.session_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    role TEXT CHECK (role IN ('editor', 'viewer')) DEFAULT 'viewer',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(session_id, profile_id)
);

ALTER TABLE public.session_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their own memberships"
    ON public.session_members FOR SELECT
    USING (profile_id = auth.uid());

CREATE POLICY "Owners can manage members"
    ON public.session_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.sessions s
            WHERE s.id = session_members.session_id
            AND s.profile_id = auth.uid()
        )
    );

-- Update existing session access policies to respect memberships
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sessions;
CREATE POLICY "Users can view sessions they own or are members of"
    ON public.sessions FOR SELECT
    USING (
        profile_id = auth.uid() OR
        is_public = true OR
        EXISTS (
            SELECT 1 FROM public.session_members sm
            WHERE sm.session_id = sessions.id AND sm.profile_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own sessions" ON public.sessions;
CREATE POLICY "Users can update sessions they own or are editors of"
    ON public.sessions FOR UPDATE
    USING (
        profile_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.session_members sm
            WHERE sm.session_id = sessions.id AND sm.profile_id = auth.uid() AND sm.role = 'editor'
        )
    );
