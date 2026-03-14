-- =============================================================
-- Migration 006: Session Context (Site & Group)
-- =============================================================

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS site_id  uuid REFERENCES public.sites(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scheduled_date date,
  ADD COLUMN IF NOT EXISTS participant_count int;

-- Update can_plan helper to be more robust
CREATE OR REPLACE FUNCTION public.can_edit_session(sess_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = sess_id
      AND (s.owner_id = auth.uid() OR (SELECT is_admin()))
  ) OR EXISTS (
    SELECT 1 FROM public.session_members
    WHERE session_id = sess_id AND profile_id = auth.uid()
  );
END;
$$;
