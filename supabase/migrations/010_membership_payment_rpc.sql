-- 멤버십 결제 처리 RPC
-- PortOne 결제 성공 후 memberships + payments + profiles를 단일 트랜잭션으로 처리
-- 실패 시 전체 롤백 → 호출부에서 PortOne 결제 취소(보상 트랜잭션) 수행

CREATE OR REPLACE FUNCTION process_membership_payment(
  p_user_id       UUID,
  p_billing_key   TEXT,       -- NULL이면 포인트 전액 결제
  p_points_used   INT,
  p_final_amount  INT,        -- 실제 결제 금액 (포인트 차감 후)
  p_payment_id    TEXT,       -- PortOne paymentId
  p_membership_price INT DEFAULT 44000,
  p_signup_bonus     INT DEFAULT 15000
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_points INT;
  v_membership_id  UUID;
  v_new_points     INT;
  v_expires_at     TIMESTAMPTZ;
BEGIN
  -- 포인트 재검증 (FOR UPDATE로 동시성 방지)
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

  -- 만료일 계산
  v_expires_at := NOW() + INTERVAL '30 days';

  -- memberships upsert
  INSERT INTO memberships (user_id, status, started_at, expires_at, auto_renew, billing_key)
  VALUES (p_user_id, 'active', NOW(), v_expires_at, p_billing_key IS NOT NULL, p_billing_key)
  ON CONFLICT (user_id) DO UPDATE
    SET status     = 'active',
        started_at = NOW(),
        expires_at = v_expires_at,
        auto_renew = p_billing_key IS NOT NULL,
        billing_key = p_billing_key
  RETURNING id INTO v_membership_id;

  -- payments insert
  INSERT INTO payments (
    user_id, membership_id, amount, points_used,
    status, pg_provider, pg_transaction_id, payment_method
  ) VALUES (
    p_user_id,
    v_membership_id,
    p_membership_price,
    p_points_used,
    'completed',
    CASE WHEN p_billing_key IS NOT NULL THEN 'kakaopay' ELSE 'points' END,
    p_payment_id,
    CASE WHEN p_billing_key IS NOT NULL THEN 'kakao_pay' ELSE 'points' END
  );

  -- profiles 업데이트 (포인트 차감 + 가입 보너스는 현금 결제 시만)
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
