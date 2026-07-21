-- 문서 테이블 (사양서 발행 내역)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_no TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  product_id UUID REFERENCES finished_products(id),
  version_id UUID REFERENCES product_versions(id),
  issue_date DATE,
  issuer TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EPR 신고 테이블 (업로드된 엑셀 실적 등)
CREATE TABLE IF NOT EXISTS epr_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_year TEXT NOT NULL,
  file_name TEXT,
  file_url TEXT,
  status TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
