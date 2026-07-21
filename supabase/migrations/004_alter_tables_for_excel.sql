-- 004_alter_tables_for_excel.sql
-- 엑셀 대량 업로드 및 화면 고도화를 위한 컬럼 추가

-- 1. 완제품(finished_products) 테이블 확장
ALTER TABLE finished_products
ADD COLUMN IF NOT EXISTS cosmetics_type text,    -- 화장품유형 (예: 일반화장품, 기능성화장품)
ADD COLUMN IF NOT EXISTS name_en text,           -- 제품영문명
ADD COLUMN IF NOT EXISTS spec text;              -- 규격 (예: 70mlx1ea)

-- 2. 포장재/부재료(packaging_components) 테이블 확장
ALTER TABLE packaging_components
ADD COLUMN IF NOT EXISTS reg_no text,            -- 부재료등록번호 (S0000001154 등)
ADD COLUMN IF NOT EXISTS spec text;              -- 규격 (PE, 35파이 등)
-- 참고: type 컬럼은 이미 존재함 (이 컬럼을 이용해 '충진부자재'와 '포장부자재' 구분)

-- 코멘트 달기
COMMENT ON COLUMN finished_products.cosmetics_type IS '화장품유형';
COMMENT ON COLUMN finished_products.name_en IS '제품영문명';
COMMENT ON COLUMN finished_products.spec IS '제품 규격';
COMMENT ON COLUMN packaging_components.reg_no IS '부재료등록번호';
COMMENT ON COLUMN packaging_components.spec IS '부재료 규격';
