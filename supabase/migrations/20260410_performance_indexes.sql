-- 핵심 조회 성능 인덱스
-- 2026-04-10

-- profiles 관련
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by
  ON profiles (UPPER(referred_by))
  WHERE referred_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles (role)
  WHERE role IN ('admin', 'sub_admin', 'casting_director');

-- memberships: cron에서 매일 스캔하는 만료/상태 조합
CREATE INDEX IF NOT EXISTS idx_memberships_status_expires
  ON memberships (status, expires_at)
  WHERE status = 'active';

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id_created
  ON payments (user_id, created_at DESC);

-- career_items / video_assets
CREATE INDEX IF NOT EXISTS idx_career_items_user_id
  ON career_items (user_id);

CREATE INDEX IF NOT EXISTS idx_video_assets_user_id
  ON video_assets (user_id);

-- admin_logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_logs') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_created
             ON admin_logs (admin_id, created_at DESC)';
  END IF;
END $$;

-- phone_verifications 만료 레코드 정리용
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'phone_verifications') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires
             ON phone_verifications (expires_at)';
  END IF;
END $$;

-- event_applications 조회 (mypage)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_applications') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_event_applications_user_applied
             ON event_applications (user_id, applied_at DESC)';
  END IF;
END $$;

-- support_history 조회 (비회원 월간 한도 체크)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_history') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_support_history_user_sent
             ON support_history (user_id, sent_at DESC)';
  END IF;
END $$;
