-- profiles 테이블에 membership_is_active 컬럼 추가
-- memberships 테이블 join 없이 멤버십 활성 여부를 빠르게 조회하기 위한 컬럼
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_is_active boolean NOT NULL DEFAULT false;

-- 기존 active 멤버십 보유 유저에 대해 backfill
UPDATE profiles p
SET membership_is_active = true
FROM memberships m
WHERE m.user_id = p.id
  AND m.status = 'active';
