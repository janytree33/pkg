-- packaging_components 테이블에 container_type (용기형태) 컬럼 추가
ALTER TABLE packaging_components
ADD COLUMN container_type text;
