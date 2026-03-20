-- =============================================
-- PEOPLE & ART - RLS (Row Level Security) 정책
-- =============================================

-- =====================
-- profiles
-- =====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 본인 프로필 읽기
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 관리자는 모든 프로필 읽기
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 본인 프로필 수정
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 신규 프로필 삽입 (회원가입 시)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================
-- artist_profiles
-- =====================
ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;

-- 공개 프로필은 누구나 열람
CREATE POLICY "artist_profiles_select_public" ON public.artist_profiles
  FOR SELECT USING (is_public = true);

-- 본인 프로필은 비공개도 열람
CREATE POLICY "artist_profiles_select_own" ON public.artist_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- 관리자는 모두 열람
CREATE POLICY "artist_profiles_select_admin" ON public.artist_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 본인만 생성/수정/삭제
CREATE POLICY "artist_profiles_insert_own" ON public.artist_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "artist_profiles_update_own" ON public.artist_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "artist_profiles_delete_own" ON public.artist_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- artist_status_tags
-- =====================
ALTER TABLE public.artist_status_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artist_status_tags_select" ON public.artist_status_tags
  FOR SELECT USING (true);

CREATE POLICY "artist_status_tags_modify_own" ON public.artist_status_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.artist_profiles WHERE id = artist_id AND user_id = auth.uid())
  );

-- =====================
-- status_tags (마스터 데이터 - 읽기 전용)
-- =====================
ALTER TABLE public.status_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "status_tags_select_all" ON public.status_tags
  FOR SELECT USING (true);

-- =====================
-- social_links
-- =====================
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_links_select_own" ON public.social_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "social_links_modify_own" ON public.social_links
  FOR ALL USING (auth.uid() = user_id);

-- =====================
-- career_items
-- =====================
ALTER TABLE public.career_items ENABLE ROW LEVEL SECURITY;

-- 공개 배우의 경력은 누구나 열람
CREATE POLICY "career_items_select_public" ON public.career_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.artist_profiles WHERE user_id = career_items.user_id AND is_public = true)
  );

CREATE POLICY "career_items_select_own" ON public.career_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "career_items_modify_own" ON public.career_items
  FOR ALL USING (auth.uid() = user_id);

-- =====================
-- artist_photos
-- =====================
ALTER TABLE public.artist_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artist_photos_select_public" ON public.artist_photos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.artist_profiles WHERE user_id = artist_photos.user_id AND is_public = true)
  );

CREATE POLICY "artist_photos_select_own" ON public.artist_photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "artist_photos_modify_own" ON public.artist_photos
  FOR ALL USING (auth.uid() = user_id);

-- =====================
-- video_assets
-- =====================
ALTER TABLE public.video_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "video_assets_select_public" ON public.video_assets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.artist_profiles WHERE user_id = video_assets.user_id AND is_public = true)
  );

CREATE POLICY "video_assets_select_own" ON public.video_assets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "video_assets_modify_own" ON public.video_assets
  FOR ALL USING (auth.uid() = user_id);

-- =====================
-- memberships
-- =====================
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memberships_select_own" ON public.memberships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "memberships_select_admin" ON public.memberships
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 서버(service_role)에서만 생성/수정
CREATE POLICY "memberships_modify_admin" ON public.memberships
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================
-- payments
-- =====================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "payments_select_admin" ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================
-- events (전체 공개)
-- =====================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_all" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "events_modify_admin" ON public.events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================
-- event_applications
-- =====================
ALTER TABLE public.event_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_applications_select_own" ON public.event_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "event_applications_select_admin" ON public.event_applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "event_applications_insert_own" ON public.event_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "event_applications_update_own" ON public.event_applications
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================
-- tours (전체 공개)
-- =====================
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tours_select_all" ON public.tours
  FOR SELECT USING (true);

CREATE POLICY "tours_modify_admin" ON public.tours
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================
-- tour_participations
-- =====================
ALTER TABLE public.tour_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tour_participations_select_own" ON public.tour_participations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tour_participations_select_admin" ON public.tour_participations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "tour_participations_insert_own" ON public.tour_participations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================
-- news (전체 공개)
-- =====================
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_select_published" ON public.news
  FOR SELECT USING (is_published = true);

CREATE POLICY "news_select_admin" ON public.news
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "news_modify_admin" ON public.news
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================
-- partners (전체 공개)
-- =====================
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners_select_all" ON public.partners
  FOR SELECT USING (is_active = true);

CREATE POLICY "partners_modify_admin" ON public.partners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================
-- support_agencies (전체 공개)
-- =====================
ALTER TABLE public.support_agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_agencies_select_all" ON public.support_agencies
  FOR SELECT USING (is_active = true);

CREATE POLICY "support_agencies_modify_admin" ON public.support_agencies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================
-- agency_applications
-- =====================
ALTER TABLE public.agency_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_applications_select_own" ON public.agency_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "agency_applications_select_admin" ON public.agency_applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "agency_applications_insert_own" ON public.agency_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================
-- reviews
-- =====================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_visible" ON public.reviews
  FOR SELECT USING (is_hidden = false);

CREATE POLICY "reviews_select_own" ON public.reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "reviews_insert_auth" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_update_own" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "reviews_delete_own" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "reviews_modify_admin" ON public.reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================
-- admin_logs (관리자만)
-- =====================
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_logs_admin_only" ON public.admin_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
