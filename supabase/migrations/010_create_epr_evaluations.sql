-- 010_create_epr_evaluations.sql
-- EPR 재질·구조 평가 관리 테이블 및 완제품 버전과의 연동 필드 추가

-- 1. epr_evaluations 테이블 생성
CREATE TABLE IF NOT EXISTS epr_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_no VARCHAR(50) NOT NULL,
  eval_name VARCHAR(255) NOT NULL,
  eval_grade VARCHAR(50) DEFAULT '미평가',
  result_pdf_url TEXT,
  component_ids JSONB DEFAULT '[]'::jsonb, -- 속한 포장재 마스터 ID 목록
  representative_image_url TEXT,
  vendor_docs JSONB DEFAULT '[]'::jsonb,
  keco_docs JSONB DEFAULT '[]'::jsonb,
  keco_evaluation_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 완제품 버전(product_versions)에 epr_evaluation_id 필드 추가
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='product_versions' AND column_name='epr_evaluation_id') THEN
        ALTER TABLE product_versions ADD COLUMN epr_evaluation_id UUID REFERENCES epr_evaluations(id) ON DELETE SET NULL;
    END IF;
END $$;
