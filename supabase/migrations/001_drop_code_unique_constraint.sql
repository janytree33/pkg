-- packaging_components 테이블의 code 컬럼 중복 방지 제약조건(Unique) 해제
ALTER TABLE public.packaging_components 
DROP CONSTRAINT IF EXISTS packaging_components_code_key;
