-- =============================================
-- 관리자 기능 확장 마이그레이션
-- =============================================

-- 1. profiles에 status, status_reason 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT '승인대기'
    CHECK (status IN ('승인대기', '승인', '탈퇴', '정지')),
  ADD COLUMN IF NOT EXISTS status_reason TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS activity_name TEXT DEFAULT NULL;

-- 기존 user들은 '승인' 상태로
UPDATE public.profiles SET status = '승인' WHERE status = '승인대기';

-- 2. events에 image_url 추가
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- 3. event_applications에 result 추가
ALTER TABLE public.event_applications
  ADD COLUMN IF NOT EXISTS result TEXT NOT NULL DEFAULT '검토중'
    CHECK (result IN ('검토중', '다음기회에', '합격'));

-- 4. banners 테이블 생성
CREATE TABLE IF NOT EXISTS public.banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  image_url   TEXT NOT NULL,
  link_url    TEXT DEFAULT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. app_settings 테이블 생성 (key-value 설정)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT DEFAULT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 웰컴포인트 설정값 삽입
INSERT INTO public.app_settings (key, value, description)
VALUES
  ('welcome_points_enabled', 'true',  '신규 가입 시 웰컴포인트 지급 여부'),
  ('welcome_points_amount',  '5000',  '신규 가입 시 웰컴포인트 금액')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- Storage 버킷 추가
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('event-images',  'event-images',  true, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('banners',       'banners',       true, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('partner-logos', 'partner-logos', true, 5242880,  ARRAY['image/jpeg','image/png','image/webp','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- RLS 정책
-- =============================================

-- banners: 누구나 읽기, 관리자만 쓰기
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "banners_public_read" ON public.banners
  FOR SELECT USING (true);

CREATE POLICY "banners_admin_all" ON public.banners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'sub_admin'))
  );

-- app_settings: 관리자만 접근
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings_admin_read" ON public.app_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'sub_admin'))
  );

CREATE POLICY "app_settings_admin_write" ON public.app_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Storage RLS: event-images
CREATE POLICY "event_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "event_images_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-images' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'sub_admin'))
  );

CREATE POLICY "event_images_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-images' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'sub_admin'))
  );

-- Storage RLS: banners
CREATE POLICY "banners_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'banners');

CREATE POLICY "banners_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'banners' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "banners_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'banners' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Storage RLS: partner-logos
CREATE POLICY "partner_logos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'partner-logos');

CREATE POLICY "partner_logos_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'partner-logos' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "partner_logos_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'partner-logos' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- handle_new_user 트리거 수정: 웰컴포인트 지급
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  welcome_enabled TEXT;
  welcome_amount  INTEGER;
BEGIN
  -- 웰컴포인트 설정 읽기
  SELECT value INTO welcome_enabled FROM public.app_settings WHERE key = 'welcome_points_enabled';
  SELECT value::integer INTO welcome_amount FROM public.app_settings WHERE key = 'welcome_points_amount';

  INSERT INTO public.profiles (id, email, name, role, points, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    'user',
    CASE WHEN welcome_enabled = 'true' THEN COALESCE(welcome_amount, 0) ELSE 0 END,
    UPPER(SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8))
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
