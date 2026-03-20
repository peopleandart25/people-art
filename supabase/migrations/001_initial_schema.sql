-- =============================================
-- PEOPLE & ART - 초기 스키마 마이그레이션
-- =============================================

-- =====================
-- 사용자 기본 프로필
-- auth.users 와 1:1 연결
-- =====================
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  name        TEXT,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'basic' CHECK (role IN ('basic', 'premium', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 배우 프로필
-- =====================
CREATE TABLE public.artist_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gender          TEXT CHECK (gender IN ('남성', '여성')),
  birth_date      DATE,
  height          NUMERIC(5,1),
  weight          NUMERIC(5,1),
  bio             TEXT,
  etc_info        TEXT,
  school          TEXT,
  is_custom_school BOOLEAN DEFAULT false,
  department      TEXT,
  graduation_status TEXT CHECK (graduation_status IN ('졸업', '재학', '중퇴', '휴학')),
  is_public       BOOLEAN DEFAULT true,
  portfolio_url   TEXT,
  portfolio_file_name TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- =====================
-- 상태 태그 마스터 데이터
-- =====================
CREATE TABLE public.status_tags (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE
);

INSERT INTO public.status_tags (name) VALUES
  ('아이돌 연습생 출신'), ('아이돌'), ('외국인'), ('모델'), ('인플루언서'),
  ('유튜버'), ('뮤지컬 배우'), ('가수'), ('성우'), ('개그맨'), ('아나운서'), ('MC'), ('나레이터');

-- =====================
-- 배우 ↔ 상태 태그 (다대다)
-- =====================
CREATE TABLE public.artist_status_tags (
  artist_id  UUID REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  tag_id     INT  REFERENCES public.status_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (artist_id, tag_id)
);

-- =====================
-- 소셜 링크
-- =====================
CREATE TABLE public.social_links (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  instagram TEXT DEFAULT '',
  youtube   TEXT DEFAULT '',
  tiktok    TEXT DEFAULT '',
  UNIQUE(user_id)
);

-- =====================
-- 경력 사항
-- =====================
CREATE TABLE public.career_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category    TEXT NOT NULL CHECK (category IN (
    '드라마','영화','광고','단편','독립','웹드라마','OTT','숏폼','연극','뮤지컬','뮤직비디오'
  )),
  year        TEXT,
  title       TEXT NOT NULL,
  role        TEXT,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 사진 자료 (서브 이미지)
-- =====================
CREATE TABLE public.artist_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  name        TEXT,
  is_main     BOOLEAN DEFAULT false,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 영상 자료
-- =====================
CREATE TABLE public.video_assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('file', 'link')),
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  thumbnail   TEXT,
  duration    TEXT,
  file_size   TEXT,
  platform    TEXT CHECK (platform IN ('youtube', 'vimeo', 'other')),
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 멤버십
-- =====================
CREATE TABLE public.memberships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_cancellation', 'cancelled')),
  started_at  TIMESTAMPTZ DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,
  auto_renew  BOOLEAN DEFAULT true,
  points      INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- =====================
-- 결제 내역
-- =====================
CREATE TABLE public.payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id),
  membership_id     UUID REFERENCES public.memberships(id),
  amount            INT NOT NULL,
  points_used       INT DEFAULT 0,
  payment_method    TEXT CHECK (payment_method IN ('card', 'kakao_pay', 'naver_pay', 'points')),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  pg_transaction_id TEXT,
  pg_provider       TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 이벤트 / 오디션
-- =====================
CREATE TABLE public.events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL CHECK (type IN ('오디션', '특강')),
  title           TEXT NOT NULL,
  description     TEXT,
  location        TEXT,
  event_time      TEXT,
  deadline        DATE,
  status          TEXT NOT NULL DEFAULT '진행중' CHECK (status IN ('진행중', '마감')),
  image_url       TEXT,
  is_member_only  BOOLEAN DEFAULT false,
  project_name    TEXT,
  director        TEXT,
  detail_content  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 이벤트 지원
-- =====================
CREATE TABLE public.event_applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'accepted', 'rejected', 'cancelled')),
  applied_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- =====================
-- 프로필 투어
-- =====================
CREATE TABLE public.tours (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT CHECK (category IN ('영화', '드라마', '광고', '기타')),
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('new', 'ongoing', 'closed')),
  description TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.tour_participations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id      UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  applied_at   TIMESTAMPTZ DEFAULT now(),
  reviewed_at  TIMESTAMPTZ,
  reviewed_by  UUID REFERENCES public.profiles(id),
  UNIQUE(tour_id, user_id)
);

-- =====================
-- 뉴스 / 소식
-- =====================
CREATE TABLE public.news (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  content       TEXT,
  excerpt       TEXT,
  image_url     TEXT,
  slug          TEXT UNIQUE,
  is_published  BOOLEAN DEFAULT true,
  published_at  TIMESTAMPTZ DEFAULT now(),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 제휴 파트너사
-- =====================
CREATE TABLE public.partners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  link        TEXT,
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 프로필 지원 기관
-- =====================
CREATE TABLE public.support_agencies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT,
  website     TEXT,
  category    TEXT CHECK (category IN ('엔터테인먼트', '광고에이전시')),
  description TEXT,
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.agency_applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   UUID NOT NULL REFERENCES public.support_agencies(id),
  user_id     UUID NOT NULL REFERENCES public.profiles(id),
  applied_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, user_id)
);

-- =====================
-- 후기
-- =====================
CREATE TABLE public.reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id),
  category    TEXT NOT NULL CHECK (category IN ('service', 'acting', 'event', 'etc')),
  title       TEXT NOT NULL,
  content     TEXT,
  image_url   TEXT,
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  is_hidden   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 관리자 작업 로그
-- =====================
CREATE TABLE public.admin_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID NOT NULL REFERENCES public.profiles(id),
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   UUID,
  old_value   JSONB,
  new_value   JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- updated_at 자동 갱신 트리거
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_artist_profiles_updated_at
  BEFORE UPDATE ON public.artist_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tours_updated_at
  BEFORE UPDATE ON public.tours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_news_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
