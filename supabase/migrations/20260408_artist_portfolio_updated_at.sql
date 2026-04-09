ALTER TABLE artist_profiles ADD COLUMN IF NOT EXISTS portfolio_updated_at timestamptz;
UPDATE artist_profiles SET portfolio_updated_at = updated_at WHERE portfolio_url IS NOT NULL AND portfolio_updated_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_artist_profiles_portfolio_updated_at ON artist_profiles(portfolio_updated_at DESC) WHERE portfolio_url IS NOT NULL;
