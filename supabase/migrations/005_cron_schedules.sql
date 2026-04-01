-- pg_cron + pg_net을 사용한 Edge Function 스케줄 등록
-- 실행 전 Supabase 대시보드에서 pg_cron, pg_net extension 활성화 필요

-- membership-expiry: 매일 자정 (UTC 00:00) 만료된 멤버십 처리
select cron.schedule(
  'membership-expiry-daily',
  '0 0 * * *',
  $$
  select net.http_post(
    url := 'https://ywokkwjetjyagqzvcepz.supabase.co/functions/v1/membership-expiry',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3b2trd2pldGp5YWdxenZjZXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTM4MDksImV4cCI6MjA4OTY2OTgwOX0.CJG3mVoP7CUC4tfrDSUgpsrTAgQsihybX02xz1mluVU"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- membership-renewal: 매일 자정 (UTC 00:00) 24시간 내 만료 예정 + 자동갱신 멤버십 결제
select cron.schedule(
  'membership-renewal-daily',
  '0 0 * * *',
  $$
  select net.http_post(
    url := 'https://ywokkwjetjyagqzvcepz.supabase.co/functions/v1/membership-renewal',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3b2trd2pldGp5YWdxenZjZXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTM4MDksImV4cCI6MjA4OTY2OTgwOX0.CJG3mVoP7CUC4tfrDSUgpsrTAgQsihybX02xz1mluVU"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
