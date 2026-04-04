-- =============================================
-- 013: updated_at 컬럼 추가 및 자동 갱신 트리거
-- =============================================

-- updated_at 자동 갱신 공통 함수
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- partners: updated_at 추가
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
UPDATE public.partners
  SET updated_at = COALESCE(created_at, NOW())
  WHERE updated_at IS NULL;

DROP TRIGGER IF EXISTS partners_set_updated_at ON public.partners;
CREATE TRIGGER partners_set_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- reviews: updated_at 추가
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
UPDATE public.reviews
  SET updated_at = COALESCE(created_at, NOW())
  WHERE updated_at IS NULL;

DROP TRIGGER IF EXISTS reviews_set_updated_at ON public.reviews;
CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- support_agencies: updated_at 추가
ALTER TABLE public.support_agencies
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
UPDATE public.support_agencies
  SET updated_at = COALESCE(created_at, NOW())
  WHERE updated_at IS NULL;

DROP TRIGGER IF EXISTS support_agencies_set_updated_at ON public.support_agencies;
CREATE TRIGGER support_agencies_set_updated_at
  BEFORE UPDATE ON public.support_agencies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 기존 테이블에도 트리거 추가 (events, news, tours, banners)
DROP TRIGGER IF EXISTS events_set_updated_at ON public.events;
CREATE TRIGGER events_set_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS news_set_updated_at ON public.news;
CREATE TRIGGER news_set_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tours_set_updated_at ON public.tours;
CREATE TRIGGER tours_set_updated_at
  BEFORE UPDATE ON public.tours
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS banners_set_updated_at ON public.banners;
CREATE TRIGGER banners_set_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
