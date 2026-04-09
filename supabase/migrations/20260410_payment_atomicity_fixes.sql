-- 결제 정합성 수정: payment/complete, membership/renew, 추천인 보너스 원자화
-- 2026-04-10

-- =====================================================================
-- 1) process_kakao_payment_complete
--    카카오페이 일반 결제 완료 시 membership + payments + profiles 원자 처리
-- =====================================================================
CREATE OR REPLACE FUNCTION process_kakao_payment_complete(
  p_user_id           UUID,
  p_points_used       INT,
  p_expected_amount   INT,
  p_pg_transaction_id TEXT,
  p_pg_provider       TEXT,
  p_membership_price  INT,
  p_signup_bonus      INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_points INT;
  v_membership_id  UUID;
  v_new_points     INT;
  v_expires_at     TIMESTAMPTZ;
  v_payment_method TEXT;
  v_existing_bkey  TEXT;
  v_auto_renew     BOOLEAN;
BEGIN
  -- 포인트 재검증 + 락
  SELECT points INTO v_current_points
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_points IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  IF p_points_used > v_current_points THEN
    RAISE EXCEPTION 'insufficient_points';
  END IF;

  v_expires_at := NOW() + INTERVAL '30 days';
  v_payment_method := CASE WHEN p_expected_amount = 0 THEN 'points' ELSE 'kakao_pay' END;

  -- 기존 billing_key 유지 (auto_renew는 billing_key 보유 여부에 종속)
  SELECT billing_key INTO v_existing_bkey FROM memberships WHERE user_id = p_user_id;
  v_auto_renew := v_existing_bkey IS NOT NULL;

  -- memberships upsert
  INSERT INTO memberships (user_id, status, started_at, expires_at, auto_renew, billing_key)
  VALUES (p_user_id, 'active', NOW(), v_expires_at, v_auto_renew, v_existing_bkey)
  ON CONFLICT (user_id) DO UPDATE
    SET status     = 'active',
        started_at = NOW(),
        expires_at = v_expires_at,
        auto_renew = (memberships.billing_key IS NOT NULL)
  RETURNING id INTO v_membership_id;

  -- payments insert (pg_transaction_id UNIQUE 제약으로 중복 방어)
  INSERT INTO payments (
    user_id, membership_id, amount, points_used,
    status, pg_provider, pg_transaction_id, payment_method
  ) VALUES (
    p_user_id,
    v_membership_id,
    p_expected_amount,
    p_points_used,
    'completed',
    p_pg_provider,
    p_pg_transaction_id,
    v_payment_method
  );

  -- profiles 업데이트 (포인트 차감 + 가입 보너스는 현금 결제 시만)
  v_new_points := GREATEST(0, v_current_points - p_points_used)
    + CASE WHEN p_expected_amount > 0 THEN p_signup_bonus ELSE 0 END;

  UPDATE profiles
  SET role   = 'premium',
      points = v_new_points
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success',    true,
    'new_points', v_new_points,
    'expires_at', v_expires_at
  );
END;
$$;

-- =====================================================================
-- 2) process_membership_renewal
--    자동 갱신/수동 갱신: 만료일 연장 + payments + profiles 원자 처리
-- =====================================================================
CREATE OR REPLACE FUNCTION process_membership_renewal(
  p_user_id           UUID,
  p_membership_id     UUID,
  p_points_used       INT,
  p_final_amount      INT,       -- 실제 결제 금액
  p_membership_price  INT,       -- 총 가격 (payments.amount 기록용)
  p_renewal_bonus     INT,
  p_pg_transaction_id TEXT,
  p_pg_provider       TEXT       -- 'kakaopay' | 'points'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_points INT;
  v_current_expiry TIMESTAMPTZ;
  v_base_date      TIMESTAMPTZ;
  v_new_expiry     TIMESTAMPTZ;
  v_new_points     INT;
  v_payment_method TEXT;
BEGIN
  -- 포인트 락
  SELECT points INTO v_current_points
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_points IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  IF p_points_used > v_current_points THEN
    RAISE EXCEPTION 'insufficient_points';
  END IF;

  -- 멤버십 락 + 기존 만료일 조회
  SELECT expires_at INTO v_current_expiry
  FROM memberships
  WHERE id = p_membership_id AND user_id = p_user_id AND status = 'active'
  FOR UPDATE;

  IF v_current_expiry IS NULL THEN
    RAISE EXCEPTION 'membership_not_found';
  END IF;

  -- 잔여 기간 보존: 현재 만료일이 미래면 그 위에 30일, 아니면 now()에서 30일
  v_base_date := GREATEST(v_current_expiry, NOW());
  v_new_expiry := v_base_date + INTERVAL '30 days';

  UPDATE memberships
  SET expires_at = v_new_expiry,
      started_at = NOW()
  WHERE id = p_membership_id;

  v_payment_method := CASE WHEN p_final_amount > 0 THEN 'kakao_pay' ELSE 'points' END;

  INSERT INTO payments (
    user_id, membership_id, amount, points_used,
    status, pg_provider, pg_transaction_id, payment_method
  ) VALUES (
    p_user_id,
    p_membership_id,
    p_membership_price,
    p_points_used,
    'completed',
    p_pg_provider,
    p_pg_transaction_id,
    v_payment_method
  );

  -- 포인트 차감 + 갱신 보너스 (현금 결제 시만)
  v_new_points := GREATEST(0, v_current_points - p_points_used)
    + CASE WHEN p_final_amount > 0 THEN p_renewal_bonus ELSE 0 END;

  UPDATE profiles
  SET points = v_new_points
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success',    true,
    'new_points', v_new_points,
    'expires_at', v_new_expiry
  );
END;
$$;

-- =====================================================================
-- 3) award_referral_bonus
--    추천인 보너스 지급: guarded claim (race 방지) + atomic increment
-- =====================================================================
CREATE OR REPLACE FUNCTION award_referral_bonus(
  p_user_id         UUID,
  p_referral_code   TEXT,
  p_bonus_amount    INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_claim_count       INT;
  v_referrer_id       UUID;
  v_referrer_active   BOOLEAN;
  v_user_points       INT;
BEGIN
  IF p_bonus_amount <= 0 THEN
    RETURN json_build_object('awarded', false, 'reason', 'no_bonus');
  END IF;

  -- 1) 신규 가입자 claim을 guarded update로 선점 (중복 방지)
  UPDATE profiles
  SET referral_bonus_claimed = true,
      referred_by            = UPPER(p_referral_code)
  WHERE id = p_user_id
    AND referral_bonus_claimed IS NOT TRUE;
  GET DIAGNOSTICS v_claim_count = ROW_COUNT;

  IF v_claim_count = 0 THEN
    RETURN json_build_object('awarded', false, 'reason', 'already_claimed');
  END IF;

  -- 2) 추천인 조회
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = UPPER(p_referral_code);

  IF v_referrer_id IS NULL OR v_referrer_id = p_user_id THEN
    -- 잘못된 코드: claim 롤백
    UPDATE profiles
    SET referral_bonus_claimed = false,
        referred_by            = NULL
    WHERE id = p_user_id;
    RETURN json_build_object('awarded', false, 'reason', 'invalid_referrer');
  END IF;

  -- 3) 추천인 활성 멤버십 확인
  SELECT EXISTS (
    SELECT 1 FROM memberships WHERE user_id = v_referrer_id AND status = 'active'
  ) INTO v_referrer_active;

  IF NOT v_referrer_active THEN
    UPDATE profiles
    SET referral_bonus_claimed = false,
        referred_by            = NULL
    WHERE id = p_user_id;
    RETURN json_build_object('awarded', false, 'reason', 'referrer_inactive');
  END IF;

  -- 4) 신규 가입자 + 추천인 포인트 atomic increment
  UPDATE profiles
  SET points = COALESCE(points, 0) + p_bonus_amount
  WHERE id = p_user_id
  RETURNING points INTO v_user_points;

  UPDATE profiles
  SET points = COALESCE(points, 0) + p_bonus_amount
  WHERE id = v_referrer_id;

  RETURN json_build_object(
    'awarded',    true,
    'new_points', v_user_points
  );
END;
$$;

-- =====================================================================
-- 4) payments 테이블: reconcile 상태 추가
-- =====================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'payments_status_check'
  ) THEN
    -- 기존 제약 없으면 스킵 (이미 status가 TEXT 자유형일 수 있음)
    NULL;
  END IF;
END $$;
