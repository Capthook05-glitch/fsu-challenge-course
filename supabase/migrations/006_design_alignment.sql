-- =============================================================
-- Migration 006: Design Alignment & Extended Metadata
-- =============================================================

-- 1. Profiles enhancement (Screen 13: Facilitator Profile)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url       text,
  ADD COLUMN IF NOT EXISTS bio              text,
  ADD COLUMN IF NOT EXISTS experience_years int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS specialties      text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS certifications   text[] DEFAULT '{}';

-- 2. Groups enhancement (Screen 10: Client Intake)
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS segment         text, -- e.g. 'Student Org', 'Corporate', 'Athletic'
  ADD COLUMN IF NOT EXISTS contact_email    text,
  ADD COLUMN IF NOT EXISTS medical_info     text; -- Secure/Encrypted intent field

-- 3. Facilitator Evaluations (Screen 11: Facilitator Evaluation)
CREATE TABLE IF NOT EXISTS public.facilitator_evaluations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  facilitator_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  evaluator_id      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  engagement_rating int CHECK (engagement_rating BETWEEN 1 AND 5),
  safety_rating     int CHECK (safety_rating BETWEEN 1 AND 5),
  goal_rating       int CHECK (goal_rating BETWEEN 1 AND 5),
  coaching_notes    text,
  incident_log      text,
  created_at        timestamptz DEFAULT now()
);

-- 4. Session Feedback enhancement (Screen 12: Impact Analytics)
ALTER TABLE public.session_feedback
  ADD COLUMN IF NOT EXISTS leadership_rating    int CHECK (leadership_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS trust_rating         int CHECK (trust_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS communication_rating int CHECK (communication_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS teamwork_rating      int CHECK (teamwork_rating BETWEEN 1 AND 5);

-- 5. RLS Policies

ALTER TABLE public.facilitator_evaluations ENABLE ROW LEVEL SECURITY;

-- Evaluations: Admins see all, Lead facilitators see their own (as evaluator or subject)
CREATE POLICY "Admins manage all evaluations" ON public.facilitator_evaluations
  FOR ALL USING (public.is_admin());

CREATE POLICY "Leads read own evaluations" ON public.facilitator_evaluations
  FOR SELECT USING (
    evaluator_id = auth.uid() OR facilitator_id = auth.uid()
  );

CREATE POLICY "Leads insert evaluations" ON public.facilitator_evaluations
  FOR INSERT WITH CHECK (
    evaluator_id = auth.uid() AND (SELECT public.can_plan())
  );

-- Update groups RLS for intake access
-- (Assuming we want facilitators to be able to see/update their own intakes)
DROP POLICY IF EXISTS "users manage own groups" ON public.groups;
CREATE POLICY "facilitators manage own groups" ON public.groups
  USING (created_by = auth.uid() OR (SELECT public.is_admin()));

-- 6. Seed some specialties and certifications for existing profiles
UPDATE public.profiles
SET specialties = ARRAY['Conflict Resolution', 'Leadership Coaching', 'Safety Management'],
    certifications = ARRAY['ACCT Level II Professional', 'Wilderness First Responder']
WHERE role = 'admin' OR role = 'lead_facilitator';
