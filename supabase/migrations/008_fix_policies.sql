
-- Fix incorrect column names and improve creation permissions

-- 1. Fix sessions policies (owner_id vs profile_id)
DROP POLICY IF EXISTS "Users can view sessions they own or are members of" ON public.sessions;
CREATE POLICY "Users can view sessions they own or are members of"
    ON public.sessions FOR SELECT
    USING (
        owner_id = auth.uid() OR
        is_public = true OR
        EXISTS (
            SELECT 1 FROM public.session_members sm
            WHERE sm.session_id = sessions.id AND sm.profile_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update sessions they own or are editors of" ON public.sessions;
CREATE POLICY "Users can update sessions they own or are editors of"
    ON public.sessions FOR UPDATE
    USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.session_members sm
            WHERE sm.session_id = sessions.id AND sm.profile_id = auth.uid() AND sm.role = 'editor'
        )
    );

-- 2. Explicitly allow planners to create courses
DROP POLICY IF EXISTS "users manage own courses" ON courses;
CREATE POLICY "Planners can create courses" ON courses
    FOR INSERT WITH CHECK (created_by = auth.uid() AND (SELECT can_plan()));

CREATE POLICY "Anyone can view courses" ON courses
    FOR SELECT USING (is_public OR created_by = auth.uid() OR (SELECT is_admin()));

CREATE POLICY "Owners can manage courses" ON courses
    FOR ALL USING (created_by = auth.uid() OR (SELECT is_admin()));

-- 3. Explicitly allow planners to manage course sessions
DROP POLICY IF EXISTS "users manage own course_sessions" ON course_sessions;
CREATE POLICY "Planners can manage course sessions" ON course_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_sessions.course_id
            AND (c.created_by = auth.uid() OR (SELECT is_admin()))
        )
    );

-- 4. Ensure sites and groups can be created by planners
DROP POLICY IF EXISTS "users manage own groups" ON groups;
CREATE POLICY "Planners manage groups" ON groups
    FOR ALL USING (created_by = auth.uid() OR (SELECT is_admin()));
CREATE POLICY "Everyone can view groups" ON groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "users manage own sites" ON sites;
CREATE POLICY "Planners manage sites" ON sites
    FOR ALL USING (created_by = auth.uid() OR (SELECT is_admin()));
CREATE POLICY "Everyone can view sites" ON sites FOR SELECT USING (true);
