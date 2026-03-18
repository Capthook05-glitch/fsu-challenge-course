
-- Migration: Enable insert for profiles during signup and support anonymous users
-- This fixes the error: "new row violates row-level security policy for table profiles"

-- 1. Support anonymous users by making email nullable
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- 2. Add insert policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Enable insert for users during signup'
    ) THEN
        CREATE POLICY "Enable insert for users during signup"
        ON "public"."profiles"
        FOR INSERT
        WITH CHECK ((auth.uid() = id));
    END IF;
END
$$;
