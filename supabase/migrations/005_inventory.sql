-- =============================================================
-- Migration 005: Equipment Inventory & Inspections
-- =============================================================

CREATE TABLE IF NOT EXISTS equipment (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  category        text, -- e.g. 'harness', 'rope', 'carabiner'
  serial_number   text UNIQUE,
  brand           text,
  model           text,
  purchase_date   date,
  last_inspection date,
  next_inspection date,
  status          text NOT NULL DEFAULT 'in_service' CHECK (status IN ('in_service','under_repair','retired')),
  condition       text NOT NULL DEFAULT 'green' CHECK (condition IN ('green','yellow','red')),
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inspections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id    uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  inspector_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  inspection_date date NOT NULL DEFAULT current_date,
  passed          bool NOT NULL DEFAULT true,
  condition_found text CHECK (condition_found IN ('green','yellow','red')),
  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE equipment   ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone authenticated can read equipment" ON equipment
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "planners manage equipment" ON equipment
  FOR ALL USING ((SELECT can_plan()));

CREATE POLICY "everyone authenticated can read inspections" ON inspections
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "planners manage inspections" ON inspections
  FOR ALL USING ((SELECT can_plan()));

-- Trigger for updated_at on equipment
CREATE TRIGGER set_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed some equipment
INSERT INTO equipment (name, category, serial_number, brand, model, condition) VALUES
('Dynamic Rope 50m', 'rope', 'DR-550-A1', 'Petzl', 'Contact', 'green'),
('Petzl Harness Large', 'harness', 'PH-L-992', 'Petzl', 'AVAO BOD FAST', 'green'),
('Black Diamond Carabiner', 'carabiner', 'BD-C-201', 'Black Diamond', 'Rocklock Screwgate', 'yellow'),
('Static Line 100ft', 'rope', 'SL-100-B4', 'Sterling', 'HTP', 'red');
