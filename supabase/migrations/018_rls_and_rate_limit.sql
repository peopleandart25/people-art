-- ============================================================
-- Migration 018: RLS 활성화 및 Rate Limiting 컬럼 추가
-- ============================================================

-- 1. Admin 체크 헬퍼 함수 (SECURITY DEFINER로 RLS 재귀 방지)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'sub_admin')
  );
$$;

-- 2. profiles RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

CREATE POLICY "profiles_select_own"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "profiles_update_own"   ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (is_admin());
CREATE POLICY "profiles_insert_own"   ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. castings RLS 활성화
ALTER TABLE castings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "castings_select_public"    ON castings;
DROP POLICY IF EXISTS "castings_insert_director"  ON castings;
DROP POLICY IF EXISTS "castings_update_own"       ON castings;
DROP POLICY IF EXISTS "castings_delete_admin"     ON castings;

CREATE POLICY "castings_select_public" ON castings FOR SELECT USING (true);
CREATE POLICY "castings_insert_director" ON castings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('casting_director', 'admin', 'sub_admin'))
);
CREATE POLICY "castings_update_own" ON castings FOR UPDATE USING (created_by = auth.uid() OR is_admin());
CREATE POLICY "castings_delete_admin" ON castings FOR DELETE USING (is_admin());

-- 4. casting_applications RLS 활성화
ALTER TABLE casting_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "casting_applications_select" ON casting_applications;
DROP POLICY IF EXISTS "casting_applications_insert" ON casting_applications;
DROP POLICY IF EXISTS "casting_applications_update" ON casting_applications;
DROP POLICY IF EXISTS "casting_applications_delete" ON casting_applications;

CREATE POLICY "casting_applications_select" ON casting_applications FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM castings WHERE id = casting_id AND created_by = auth.uid())
  OR is_admin()
);
CREATE POLICY "casting_applications_insert" ON casting_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "casting_applications_update" ON casting_applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM castings WHERE id = casting_id AND created_by = auth.uid())
  OR is_admin()
);
CREATE POLICY "casting_applications_delete" ON casting_applications FOR DELETE USING (
  user_id = auth.uid() OR is_admin()
);

-- 5. phone_verifications rate limiting 컬럼 추가
ALTER TABLE phone_verifications ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
ALTER TABLE phone_verifications ADD COLUMN IF NOT EXISTS last_sent_at timestamptz;
