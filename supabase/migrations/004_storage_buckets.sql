-- =============================================
-- Storage 버킷 생성
-- =============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',       'avatars',       true,  5242880,   ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('artist-photos', 'artist-photos', true,  5242880,   ARRAY['image/jpeg','image/png','image/webp']),
  ('videos',        'videos',        false, 524288000, ARRAY['video/mp4','video/quicktime','video/webm']),
  ('portfolios',    'portfolios',    false, 20971520,  ARRAY['application/pdf']),
  ('news-images',   'news-images',   true,  5242880,   ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- =====================
-- Storage RLS 정책
-- =====================

-- avatars: 누구나 읽기, 본인만 업로드
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_auth_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_auth_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- artist-photos: 누구나 읽기, 본인만 업로드
CREATE POLICY "artist_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'artist-photos');

CREATE POLICY "artist_photos_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'artist-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "artist_photos_auth_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'artist-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- videos: 로그인 사용자만 읽기, 본인만 업로드
CREATE POLICY "videos_auth_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'videos' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "videos_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "videos_auth_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- portfolios: 로그인 사용자만 읽기, 본인만 업로드
CREATE POLICY "portfolios_auth_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'portfolios' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "portfolios_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "portfolios_auth_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- news-images: 누구나 읽기, 관리자만 업로드
CREATE POLICY "news_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'news-images');

CREATE POLICY "news_images_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'news-images' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "news_images_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'news-images' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
