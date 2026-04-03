-- =============================================
-- profiles 테이블에 소셜 로그인 provider 컬럼 추가
-- =============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS provider TEXT;

-- 기존 유저: auth.users의 app_metadata에서 provider 값 backfill
UPDATE public.profiles p
SET provider = COALESCE(
  (SELECT u.raw_app_meta_data->>'provider' FROM auth.users u WHERE u.id = p.id),
  'email'
)
WHERE p.provider IS NULL;

-- 신규 유저 트리거: provider 포함 저장
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
  );

  -- 소셜 링크 기본값 생성
  INSERT INTO public.social_links (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
