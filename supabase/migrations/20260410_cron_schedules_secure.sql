-- cron_schedules 재구성: anon JWT 하드코드 제거 + renewal/expiry 실행 순서 분리
-- 2026-04-10
--
-- Supabase Vault에 아래 시크릿을 미리 등록해야 함(운영팀이 수동 실행 or Supabase dashboard):
--   SELECT vault.create_secret('<anon jwt>', 'cron_auth_token');
--   SELECT vault.create_secret('https://<project>.supabase.co/functions/v1', 'functions_base_url');
-- (anon 키이며, edge function 측에서 자체 auth를 재검증함)

-- 1) 기존 스케줄 제거 (하드코드 JWT 포함)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT jobname FROM cron.job WHERE jobname IN (
    'membership-expiry-daily',
    'membership-renewal-daily'
  )
  LOOP
    PERFORM cron.unschedule(r.jobname);
  END LOOP;
END $$;

-- 2) vault 기반 헬퍼 함수
CREATE OR REPLACE FUNCTION public.invoke_edge_function(p_fn TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  v_token TEXT;
  v_base  TEXT;
  v_req_id BIGINT;
BEGIN
  SELECT decrypted_secret INTO v_token FROM vault.decrypted_secrets WHERE name = 'cron_auth_token';
  SELECT decrypted_secret INTO v_base  FROM vault.decrypted_secrets WHERE name = 'functions_base_url';

  IF v_token IS NULL OR v_base IS NULL THEN
    RAISE EXCEPTION 'cron vault secrets not configured';
  END IF;

  SELECT net.http_post(
    url := v_base || '/' || p_fn,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_token
    ),
    body := '{}'::jsonb
  ) INTO v_req_id;

  RETURN v_req_id;
END;
$$;

-- 3) renewal을 먼저 (UTC 23:00) 실행해서 만료 전에 갱신
SELECT cron.schedule(
  'membership-renewal-daily',
  '0 23 * * *',
  $cron$SELECT public.invoke_edge_function('membership-renewal');$cron$
);

-- 4) expiry는 renewal 이후 (UTC 01:00) 실행
SELECT cron.schedule(
  'membership-expiry-daily',
  '0 1 * * *',
  $cron$SELECT public.invoke_edge_function('membership-expiry');$cron$
);
