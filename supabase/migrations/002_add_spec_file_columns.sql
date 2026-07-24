-- packaging_components 테이블에 성적서 파일 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE packaging_components
  ADD COLUMN IF NOT EXISTS spec_file_data  TEXT,
  ADD COLUMN IF NOT EXISTS spec_file_name  VARCHAR(255);
