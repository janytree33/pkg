-- 부자재 테이블(packaging_components)에 '평가 구분' (자체/공인) 저장을 위한 컬럼 추가
-- 기존 테이블에 eval_type 컬럼이 존재하지 않을 때만 생성

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='packaging_components' AND column_name='eval_type') THEN
        ALTER TABLE packaging_components ADD COLUMN eval_type TEXT DEFAULT '미평가';
    END IF;
END $$;
