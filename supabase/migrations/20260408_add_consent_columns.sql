-- Add consent timestamp columns for personal info / marketing agreements
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS privacy_agreed_at timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_agreed_at timestamptz;
