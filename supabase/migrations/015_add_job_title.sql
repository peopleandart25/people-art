-- profiles 테이블에 job_title 컬럼 추가 (소속 회사에서의 직책)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title text;
