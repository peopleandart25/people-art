-- =============================================
-- 프로필 지원 내역 테이블
-- =============================================

CREATE TABLE IF NOT EXISTS public.support_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agency_id  UUID NOT NULL REFERENCES public.support_agencies(id) ON DELETE CASCADE,
  sent_at    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_history_user_select" ON public.support_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "support_history_user_insert" ON public.support_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "support_history_admin_select" ON public.support_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'sub_admin'))
  );
