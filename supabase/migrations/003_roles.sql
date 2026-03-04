-- =============================================================
-- Migration 003: 3-tier role system + session sharing
-- =============================================================

-- A. Update role constraint to support three roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin','lead_facilitator','assistant_facilitator'));

-- Migrate existing 'facilitator' rows → 'lead_facilitator'
UPDATE profiles SET role = 'lead_facilitator' WHERE role = 'facilitator';

-- Update column default
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'lead_facilitator';

-- Update new-user trigger to use lead_facilitator as default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (new.id, new.email, split_part(new.email, '@', 1), 'lead_facilitator');
  RETURN new;
END;
$$;

-- B. Update is_admin helper (unchanged — still checks for 'admin' role)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper: check if caller can plan (admin or lead_facilitator)
CREATE OR REPLACE FUNCTION public.can_plan()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin','lead_facilitator')
  );
$$;

-- C. Session members table (for sharing sessions)
CREATE TABLE IF NOT EXISTS session_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'assistant'
               CHECK (role IN ('assistant','co_lead')),
  added_by   uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, profile_id)
);

ALTER TABLE session_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session members can read membership" ON session_members
  FOR SELECT USING (
    profile_id = auth.uid() OR
    session_id IN (SELECT id FROM sessions WHERE owner_id = auth.uid()) OR
    (SELECT is_admin())
  );

CREATE POLICY "owners and admins manage members" ON session_members
  FOR ALL USING (
    session_id IN (SELECT id FROM sessions WHERE owner_id = auth.uid()) OR
    (SELECT is_admin())
  );

-- D. Update sessions RLS — members can now read sessions shared with them
DROP POLICY IF EXISTS "Users can read own sessions" ON sessions;
CREATE POLICY "Users can read accessible sessions" ON sessions
  FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (SELECT session_id FROM session_members WHERE profile_id = auth.uid()) OR
    (SELECT is_admin())
  );

-- Restrict session CREATE to users who can plan
DROP POLICY IF EXISTS "Users can create own sessions" ON sessions;
CREATE POLICY "Planners can create sessions" ON sessions
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() AND (SELECT can_plan())
  );

-- E. Update timeline_blocks RLS — members can read, only owners/admins can write
DROP POLICY IF EXISTS "users manage own timeline_blocks" ON timeline_blocks;

CREATE POLICY "users can read accessible blocks" ON timeline_blocks
  FOR SELECT USING (
    session_id IN (SELECT id FROM sessions WHERE owner_id = auth.uid()) OR
    session_id IN (SELECT session_id FROM session_members WHERE profile_id = auth.uid()) OR
    (SELECT is_admin())
  );

CREATE POLICY "owners and admins can write blocks" ON timeline_blocks
  FOR ALL USING (
    session_id IN (SELECT id FROM sessions WHERE owner_id = auth.uid()) OR
    (SELECT is_admin())
  );

-- F. Admin can read all profiles (for user management UI)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read profiles" ON profiles
  FOR SELECT USING (id = auth.uid() OR (SELECT is_admin()));

-- Admin can update any profile (role changes)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update profiles" ON profiles
  FOR UPDATE USING (id = auth.uid() OR (SELECT is_admin()));
