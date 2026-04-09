-- 온보딩 강화: phone unique, career_items 원자 교체 RPC
-- 2026-04-10

-- 1) profiles.phone partial unique index (null 허용)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique
  ON profiles ((lower(phone)))
  WHERE phone IS NOT NULL AND phone <> '';

-- 2) replace_career_items: 기존 삭제 + 일괄 삽입을 단일 트랜잭션으로
CREATE OR REPLACE FUNCTION replace_career_items(
  p_user_id UUID,
  p_items   JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM career_items WHERE user_id = p_user_id;

  IF p_items IS NOT NULL AND jsonb_typeof(p_items) = 'array' AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO career_items (user_id, category, year, title, role, sort_order)
    SELECT
      p_user_id,
      item->>'category',
      NULLIF(item->>'year', ''),
      item->>'title',
      NULLIF(item->>'role', ''),
      (ord - 1)::int
    FROM jsonb_array_elements(p_items) WITH ORDINALITY AS t(item, ord)
    WHERE COALESCE(item->>'title', '') <> '';
  END IF;
END;
$$;
