-- 009_add_epr_set_and_keco_fields.sql
-- N개의 부자재를 1개 평가 세트로 묶는 epr_set_id 및 한국환경공단 실적신고용 컬럼 추가

DO $$
BEGIN
    -- 1. epr_set_id (세트 그룹핑 ID)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='packaging_components' AND column_name='epr_set_id') THEN
        ALTER TABLE packaging_components ADD COLUMN epr_set_id UUID;
    END IF;

    -- 2. raw_materials (세부 수지 성분명, 예: LDPE/HDPE/EVOH)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='packaging_components' AND column_name='raw_materials') THEN
        ALTER TABLE packaging_components ADD COLUMN raw_materials TEXT;
    END IF;

    -- 3. keco_type_code (공단 포장재 종류 코드, 예: 01, 02, 06, 08)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='packaging_components' AND column_name='keco_type_code') THEN
        ALTER TABLE packaging_components ADD COLUMN keco_type_code VARCHAR(10);
    END IF;

    -- 4. keco_evaluation_data (공단 신청화면 체크박스 선택값 및 동적 폼 데이터)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='packaging_components' AND column_name='keco_evaluation_data') THEN
        ALTER TABLE packaging_components ADD COLUMN keco_evaluation_data JSONB DEFAULT '{}'::jsonb;
    END IF;

END $$;
