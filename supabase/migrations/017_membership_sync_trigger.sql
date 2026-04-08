-- memberships.status 변경 시 profiles.membership_is_active 자동 동기화 트리거
-- 이 트리거가 있으면 complete/webhook/expiry/renewal 각 경로에서 명시적 업데이트가 없어도 정합성 유지

CREATE OR REPLACE FUNCTION sync_membership_is_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET membership_is_active = EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = NEW.user_id
      AND status = 'active'
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS membership_status_sync ON memberships;
CREATE TRIGGER membership_status_sync
  AFTER INSERT OR UPDATE OF status ON memberships
  FOR EACH ROW
  EXECUTE FUNCTION sync_membership_is_active();
