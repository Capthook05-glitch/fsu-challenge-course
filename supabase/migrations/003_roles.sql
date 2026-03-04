-- =============================================================
-- Migration 003: 3-tier role system + session sharing
-- =============================================================

-- A. Drop whatever check constraint exists on profiles.role (name may vary),
--    then add a new named one with the three allowed roles.
DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT conname INTO v_constraint
  FROM pg_constraint pc
  JOIN pg_class pt ON pt.oid = pc.conrelid
  JOIN pg_namespace pn ON pn.oid = pt.relnamespace
  WHERE pn.nspname = 'public'
    AND pt.relname  = 'profiles'
    AND pc.contype  = 'c'
    AND pg_get_constraintdef(pc.oid) ILIKE '%admin%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || quote_ident(v_constraint);
  END IF;
END;
$$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin','lead_facilitator','assistant_facilitator'));

-- Migrate existing 'facilitator' rows to 'lead_facilitator'
UPDATE public.profiles SET role = 'lead_facilitator' WHERE role = 'facilitator';

-- Update column default for new sign-ups
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'lead_facilitator';

-- B. Update the new-user trigger to default to lead_facilitator
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    split_part(new.email, '@', 1),
    'lead_facilitator'
  );
  RETURN new;
END;
$$;

-- C. Update is_admin helper (unchanged logic)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper: can_plan — true for admin and lead_facilitator
CREATE OR REPLACE FUNCTION public.can_plan()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin','lead_facilitator')
  );
$$;

-- D. Session members table (session sharing)
CREATE TABLE IF NOT EXISTS session_members (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid        NOT NULL REFERENCES sessions(id)  ON DELETE CASCADE,
  profile_id uuid        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  role       text        NOT NULL DEFAULT 'assistant'
               CHECK (role IN ('assistant','co_lead')),
  added_by   uuid        REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, profile_id)
);

ALTER TABLE session_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session members can read membership" ON session_members
  FOR SELECT USING (
    profile_id = auth.uid()
    OR session_id IN (SELECT id FROM sessions WHERE owner_id = auth.uid())
    OR (SELECT is_admin())
  );

CREATE POLICY "owners and admins manage members" ON session_members
  FOR ALL USING (
    session_id IN (SELECT id FROM sessions WHERE owner_id = auth.uid())
    OR (SELECT is_admin())
  );

-- E. Update sessions SELECT policy — members can now read shared sessions
DROP POLICY IF EXISTS "Users can read own sessions" ON sessions;

CREATE POLICY "Users can read accessible sessions" ON sessions
  FOR SELECT USING (
    owner_id = auth.uid()
    OR id IN (SELECT session_id FROM session_members WHERE profile_id = auth.uid())
    OR (SELECT is_admin())
  );

-- Restrict session INSERT to planners (admin + lead_facilitator)
DROP POLICY IF EXISTS "Users can create own sessions" ON sessions;

CREATE POLICY "Planners can create sessions" ON sessions
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() AND (SELECT can_plan())
  );

-- F. Update timeline_blocks policies — members read, owners/admins write
DROP POLICY IF EXISTS "users manage own timeline_blocks" ON timeline_blocks;

CREATE POLICY "users can read accessible blocks" ON timeline_blocks
  FOR SELECT USING (
    session_id IN (SELECT id FROM sessions WHERE owner_id = auth.uid())
    OR session_id IN (SELECT session_id FROM session_members WHERE profile_id = auth.uid())
    OR (SELECT is_admin())
  );

CREATE POLICY "owners and admins can write blocks" ON timeline_blocks
  FOR ALL USING (
    session_id IN (SELECT id FROM sessions WHERE owner_id = auth.uid())
    OR (SELECT is_admin())
  );

-- G. Profiles — admin can read and update all profiles (for user management)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

CREATE POLICY "Users can read profiles" ON profiles
  FOR SELECT USING (id = auth.uid() OR (SELECT is_admin()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update profiles" ON profiles
  FOR UPDATE USING (id = auth.uid() OR (SELECT is_admin()));
