-- videos, portfolios 버킷을 public으로 변경
-- 이전 마이그레이션에서 private으로 생성되었으나
-- getPublicUrl()을 사용하므로 public이어야 접근 가능

UPDATE storage.buckets SET public = true WHERE id IN ('videos', 'portfolios');
