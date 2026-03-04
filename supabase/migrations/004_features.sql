-- =============================================================
-- Migration 004: Templates, Safety, Logs, Comments, Incidents,
--                Curriculum, Analytics helpers
-- =============================================================

-- P11: Facilitator assignment per block
ALTER TABLE timeline_blocks
  ADD COLUMN IF NOT EXISTS assigned_facilitator text;

-- P14: Block-level comments
CREATE TABLE IF NOT EXISTS block_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id    uuid REFERENCES timeline_blocks(id) ON DELETE CASCADE,
  session_id  uuid REFERENCES sessions(id) ON DELETE CASCADE,
  author_id   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  body        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE block_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session team can read comments" ON block_comments
  FOR SELECT USING (
    session_id IN (SELECT id FROM sessions WHERE owner_id = auth.uid()) OR
    session_id IN (SELECT session_id FROM session_members WHERE profile_id = auth.uid()) OR
    (SELECT is_admin())
  );
CREATE POLICY "authenticated can insert comments" ON block_comments
  FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "author can delete own comments" ON block_comments
  FOR DELETE USING (author_id = auth.uid() OR (SELECT is_admin()));

-- P15: Incident / near-miss reports
CREATE TABLE IF NOT EXISTS incident_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid REFERENCES sessions(id) ON DELETE CASCADE,
  block_id        uuid REFERENCES timeline_blocks(id) ON DELETE SET NULL,
  severity        text NOT NULL DEFAULT 'near_miss' CHECK (severity IN ('near_miss','minor','moderate','major')),
  what_happened   text NOT NULL,
  contributing_factors text,
  immediate_action    text,
  follow_up_needed    bool DEFAULT false,
  follow_up_notes     text,
  reported_by     uuid REFERENCES profiles(id),
  reported_at     timestamptz DEFAULT now()
);
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team can read incidents" ON incident_reports
  FOR SELECT USING (
    session_id IN (SELECT id FROM sessions WHERE owner_id = auth.uid()) OR
    (SELECT is_admin())
  );
CREATE POLICY "facilitators can write incidents" ON incident_reports
  FOR ALL USING (
    session_id IN (SELECT id FROM sessions WHERE owner_id = auth.uid()) OR
    session_id IN (SELECT session_id FROM session_members WHERE profile_id = auth.uid()) OR
    (SELECT is_admin())
  );

-- P16: Training curriculum / course sequences
CREATE TABLE IF NOT EXISTS courses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  goals       text[],
  created_by  uuid REFERENCES profiles(id),
  is_public   bool DEFAULT false,
  created_at  timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS course_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   uuid REFERENCES courses(id) ON DELETE CASCADE,
  session_id  uuid REFERENCES sessions(id) ON DELETE CASCADE,
  position    int NOT NULL DEFAULT 0,
  notes       text,
  UNIQUE(course_id, session_id)
);
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own courses" ON courses
  USING (created_by = auth.uid() OR is_public OR (SELECT is_admin()));
CREATE POLICY "users manage own course_sessions" ON course_sessions
  USING (course_id IN (SELECT id FROM courses WHERE created_by = auth.uid()) OR (SELECT is_admin()));

-- Ensure block_logs has RLS for session team members too
DROP POLICY IF EXISTS "users manage own block_logs" ON block_logs;
CREATE POLICY "team can manage block_logs" ON block_logs
  USING (
    session_id IN (SELECT id FROM sessions WHERE owner_id = auth.uid()) OR
    session_id IN (SELECT session_id FROM session_members WHERE profile_id = auth.uid()) OR
    (SELECT is_admin())
  );

-- Ensure session_templates has broader read access (public templates)
DROP POLICY IF EXISTS "users manage own templates" ON session_templates;
CREATE POLICY "users can read templates" ON session_templates
  FOR SELECT USING (created_by = auth.uid() OR is_public OR (SELECT is_admin()));
CREATE POLICY "planners can write templates" ON session_templates
  FOR ALL USING (created_by = auth.uid() OR (SELECT is_admin()));
