-- Add company column to profiles for casting directors
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company text;

-- Backfill: casting directors have been storing their company name in activity_name
UPDATE profiles
SET company = activity_name,
    activity_name = NULL
WHERE role = 'casting_director'
  AND activity_name IS NOT NULL
  AND company IS NULL;
