-- =============================================================
-- Migration 002: Session Lab features
-- =============================================================

-- Enhance games with intensity + safety fields
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS physical_intensity      int CHECK (physical_intensity      BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS psychological_intensity int CHECK (psychological_intensity BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS safety_notes            text,
  ADD COLUMN IF NOT EXISTS learning_objectives     text[];

-- Timeline blocks (richer replacement for session_games ordering)
CREATE TABLE IF NOT EXISTS timeline_blocks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid REFERENCES sessions(id) ON DELETE CASCADE,
  block_type   text NOT NULL DEFAULT 'activity'
                 CHECK (block_type IN ('activity','debrief','break','transition','custom')),
  game_id      uuid REFERENCES games(id) ON DELETE SET NULL,
  title        text,
  start_time   int NOT NULL DEFAULT 0,
  duration_min int NOT NULL DEFAULT 30,
  location     text,
  notes        text,
  subgroup     text,
  position     int NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Debrief question sets
CREATE TABLE IF NOT EXISTS debrief_question_sets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  questions   text[] NOT NULL,
  theory_tags text[],
  created_by  uuid REFERENCES profiles(id),
  is_public   bool DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- After-action logs per block
CREATE TABLE IF NOT EXISTS block_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id         uuid REFERENCES timeline_blocks(id) ON DELETE CASCADE,
  session_id       uuid REFERENCES sessions(id) ON DELETE CASCADE,
  what_happened    text,
  group_reaction   text,
  change_next_time text,
  submitted_by     uuid REFERENCES profiles(id),
  submitted_at     timestamptz DEFAULT now()
);

-- Session templates
CREATE TABLE IF NOT EXISTS session_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  blocks      jsonb NOT NULL DEFAULT '[]',
  created_by  uuid REFERENCES profiles(id),
  is_public   bool DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- Group profiles
CREATE TABLE IF NOT EXISTS groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  goals       text[],
  constraints text,
  size_min    int,
  size_max    int,
  created_by  uuid REFERENCES profiles(id),
  created_at  timestamptz DEFAULT now()
);

-- Site profiles
CREATE TABLE IF NOT EXISTS sites (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL,
  description        text,
  available_elements text[],
  constraints        text,
  created_by         uuid REFERENCES profiles(id),
  created_at         timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE timeline_blocks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE debrief_question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups                ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites                 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own timeline_blocks" ON timeline_blocks
  USING (session_id IN (SELECT id FROM sessions WHERE owner_id = auth.uid()));
CREATE POLICY "users manage own block_logs" ON block_logs
  USING (submitted_by = auth.uid());
CREATE POLICY "public read debrief_sets" ON debrief_question_sets
  FOR SELECT USING (is_public OR created_by = auth.uid());
CREATE POLICY "users manage own debrief_sets" ON debrief_question_sets
  USING (created_by = auth.uid());
CREATE POLICY "users manage own templates" ON session_templates
  USING (created_by = auth.uid() OR is_public);
CREATE POLICY "users manage own groups" ON groups USING (created_by = auth.uid());
CREATE POLICY "users manage own sites"  ON sites  USING (created_by = auth.uid());

-- Trigger for updated_at on timeline_blocks
CREATE TRIGGER set_timeline_blocks_updated_at
  BEFORE UPDATE ON timeline_blocks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed 3 debrief question sets
INSERT INTO debrief_question_sets (title, questions, theory_tags, is_public) VALUES
('Experience & Apply (Kolb)', ARRAY[
  'What happened? What did you notice?',
  'How did that feel in the moment?',
  'What does that remind you of in real life?',
  'What will you do differently going forward?'
], ARRAY['kolb'], true),
('Trust & Safety Check-in', ARRAY[
  'How safe did you feel during that activity?',
  'What helped you feel supported by the group?',
  'Is there anything the group could do to increase trust?'
], ARRAY['psychological_safety'], true),
('Skill Capitalization', ARRAY[
  'What strengths did you see in yourself?',
  'What strengths did you see in others?',
  'How can you use those strengths tomorrow?'
], ARRAY['capitalization'], true);
