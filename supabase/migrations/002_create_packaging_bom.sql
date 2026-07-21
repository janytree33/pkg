-- 포장재 테이블
CREATE TABLE IF NOT EXISTS packaging_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  material TEXT,
  weight_g NUMERIC,
  supplier TEXT,
  supplier_spec_doc TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 완제품 테이블
CREATE TABLE IF NOT EXISTS finished_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand_type TEXT,
  net_weight_g NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 완제품 버전 테이블
CREATE TABLE IF NOT EXISTS product_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES finished_products(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOM 항목 테이블 (완제품 버전에 속한 포장재 매핑)
CREATE TABLE IF NOT EXISTS bom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID REFERENCES product_versions(id) ON DELETE CASCADE,
  component_id UUID REFERENCES packaging_components(id),
  qty INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
