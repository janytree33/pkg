-- 005_add_prod_report_name.sql
-- 생산실적보고서 매칭을 위한 완제품 테이블 컬럼 추가

ALTER TABLE finished_products
ADD COLUMN IF NOT EXISTS prod_report_name text;

COMMENT ON COLUMN finished_products.prod_report_name IS '생산실적보고 제품명';
