-- =============================================
-- event_applications: admin/sub_admin이 result 변경 가능하도록 RLS 추가
-- =============================================

CREATE POLICY "event_applications_update_admin" ON public.event_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'sub_admin')
    )
  );
