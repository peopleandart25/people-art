-- FIX 1: DB trigger to manage portfolio_updated_at server-side.
-- Replaces client-side flag that could be forged.

-- Backfill any existing portfolio rows missing a timestamp
UPDATE artist_profiles
SET portfolio_updated_at = COALESCE(portfolio_updated_at, updated_at, now())
WHERE portfolio_url IS NOT NULL;

-- Trigger function: bump portfolio_updated_at when portfolio_url actually changes
CREATE OR REPLACE FUNCTION bump_portfolio_updated_at() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.portfolio_url IS NOT NULL THEN
      NEW.portfolio_updated_at := now();
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.portfolio_url IS DISTINCT FROM OLD.portfolio_url AND NEW.portfolio_url IS NOT NULL THEN
      NEW.portfolio_updated_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bump_portfolio_updated_at ON artist_profiles;
CREATE TRIGGER trg_bump_portfolio_updated_at
  BEFORE INSERT OR UPDATE OF portfolio_url ON artist_profiles
  FOR EACH ROW EXECUTE FUNCTION bump_portfolio_updated_at();
