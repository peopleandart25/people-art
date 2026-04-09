ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cd_approval_status text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_cd_approval_status_check') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_cd_approval_status_check
      CHECK (cd_approval_status IS NULL OR cd_approval_status IN ('pending','approved','rejected'));
  END IF;
END $$;

-- Backfill existing CDs as approved (grandfather clause)
UPDATE profiles SET cd_approval_status = 'approved' WHERE role = 'casting_director' AND cd_approval_status IS NULL;
