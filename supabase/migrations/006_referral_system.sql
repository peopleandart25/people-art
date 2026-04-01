-- =============================================
-- 추천인 시스템
-- profiles에 referral_code, referred_by 컬럼 추가
-- =============================================

-- 1. 컬럼 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by   TEXT DEFAULT NULL;

-- 2. 기존 유저에게 referral_code 생성 (UUID 앞 8자리 대문자)
UPDATE public.profiles
SET referral_code = UPPER(SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE referral_code IS NULL;

-- 3. 신규 가입 트리거 업데이트 (referral_code 자동 생성 포함)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    UPPER(SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8))
  );

  INSERT INTO public.social_links (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
