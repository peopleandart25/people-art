-- PG사 디커플링: payment_method/pg_provider에서 카카오 하드코딩 제거
-- payment_method는 결제 수단 레벨 ('card' | 'points')
-- pg_provider는 호출부에서 PortOne 응답 기반으로 전달

-- 1) process_membership_payment: p_pg_provider 파라미터 추가 + 'kakao_pay' → 'card'
CREATE OR REPLACE FUNCTION process_membership_payment(
  p_user_id       UUID,
  p_billing_key   TEXT,
  p_points_used   INT,
  p_final_amount  INT,
  p_payment_id    TEXT,
  p_membership_price INT DEFAULT 44000,
  p_signup_bonus     INT DEFAULT 15000,
  p_pg_provider      TEXT DEFAULT 'unknown'
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
BEGIN
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

  INSERT INTO memberships (user_id, status, started_at, expires_at, auto_renew, billing_key)
  VALUES (p_user_id, 'active', NOW(), v_expires_at, p_billing_key IS NOT NULL, p_billing_key)
  ON CONFLICT (user_id) DO UPDATE
    SET status     = 'active',
        started_at = NOW(),
        expires_at = v_expires_at,
        auto_renew = p_billing_key IS NOT NULL,
        billing_key = p_billing_key
  RETURNING id INTO v_membership_id;

  INSERT INTO payments (
    user_id, membership_id, amount, points_used,
    status, pg_provider, pg_transaction_id, payment_method
  ) VALUES (
    p_user_id,
    v_membership_id,
    p_membership_price,
    p_points_used,
    'completed',
    CASE WHEN p_billing_key IS NOT NULL THEN p_pg_provider ELSE 'points' END,
    p_payment_id,
    CASE WHEN p_billing_key IS NOT NULL THEN 'card' ELSE 'points' END
  );

  v_new_points := GREATEST(0, v_current_points - p_points_used)
    + CASE WHEN p_final_amount > 0 THEN p_signup_bonus ELSE 0 END;

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

-- 2) process_membership_renewal: 'kakao_pay' → 'card'
CREATE OR REPLACE FUNCTION process_membership_renewal(
  p_user_id           UUID,
  p_membership_id     UUID,
  p_points_used       INT,
  p_final_amount      INT,
  p_membership_price  INT,
  p_renewal_bonus     INT,
  p_pg_transaction_id TEXT,
  p_pg_provider       TEXT
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

  SELECT expires_at INTO v_current_expiry
  FROM memberships
  WHERE id = p_membership_id AND user_id = p_user_id AND status = 'active'
  FOR UPDATE;

  IF v_current_expiry IS NULL THEN
    RAISE EXCEPTION 'membership_not_found';
  END IF;

  v_base_date := GREATEST(v_current_expiry, NOW());
  v_new_expiry := v_base_date + INTERVAL '30 days';

  UPDATE memberships
  SET expires_at = v_new_expiry,
      started_at = NOW()
  WHERE id = p_membership_id;

  v_payment_method := CASE WHEN p_final_amount > 0 THEN 'card' ELSE 'points' END;

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

-- 3) payments CHECK 제약 업데이트: 'kakao_pay' → 'card' 이미 허용, 'naver_pay' 제거
-- 기존 CHECK 제약 제거 후 PG-agnostic 제약 추가
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IN ('card', 'points'));

-- 기존 'kakao_pay' 레코드를 'card'로 일괄 업데이트
UPDATE payments SET payment_method = 'card' WHERE payment_method = 'kakao_pay';
UPDATE payments SET payment_method = 'card' WHERE payment_method = 'naver_pay';
