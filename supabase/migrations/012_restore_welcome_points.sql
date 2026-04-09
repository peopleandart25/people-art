-- =============================================
-- handle_new_user 트리거에 웰컴포인트 로직 복원
-- 011_provider_column.sql에서 provider 컬럼 저장용으로 함수를 덮어쓰면서
-- 008_admin_features.sql에 있던 웰컴포인트 지급 로직이 유실됨.
-- provider 저장 + 웰컴포인트 지급 + social_links 생성 모두 포함.
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  welcome_enabled TEXT;
  welcome_amount  INTEGER;
BEGIN
  SELECT value INTO welcome_enabled FROM public.app_settings WHERE key = 'welcome_points_enabled';
  SELECT value::integer INTO welcome_amount FROM public.app_settings WHERE key = 'welcome_points_amount';

  INSERT INTO public.profiles (id, email, name, provider, points, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    CASE WHEN welcome_enabled = 'true' THEN COALESCE(welcome_amount, 0) ELSE 0 END,
    UPPER(SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.social_links (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
