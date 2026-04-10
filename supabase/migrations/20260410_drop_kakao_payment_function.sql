-- 카카오페이 일회성 결제 함수 제거
-- billing/issue (KG이니시스 정기결제) 방식으로 통일되어 불필요
DROP FUNCTION IF EXISTS process_kakao_payment_complete(
  UUID, INT, INT, TEXT, TEXT, INT, INT
);
