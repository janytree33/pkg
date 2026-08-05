-- 부자재 테이블(packaging_components)에 재질간이평가 결과 저장을 위한 컬럼 추가
-- 기존 데이터베이스가 깨지지 않도록 IF NOT EXISTS 형식은 직접적으로 컬럼에 지원되지 않지만
-- PostgreSQL에서는 보통 DO 블록을 통해 처리합니다.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='packaging_components' AND column_name='material_eval_result') THEN
        ALTER TABLE packaging_components ADD COLUMN material_eval_result TEXT DEFAULT '미평가';
    END IF;
END $$;
