-- 회사 정보 테이블
CREATE TABLE IF NOT EXISTS company_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ko TEXT,
  name_en TEXT,
  business_no TEXT,
  ceo_name TEXT,
  address_ko TEXT,
  address_en TEXT,
  phone TEXT,
  fax TEXT,
  email TEXT,
  logo TEXT,
  stamp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 연동 계정 테이블
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  site_name TEXT,
  site_url TEXT,
  username TEXT NOT NULL,
  password TEXT NOT NULL, -- AES 암호화 저장
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EPR 면제 조건 테이블
CREATE TABLE IF NOT EXISTS epr_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  threshold TEXT NOT NULL,
  is_exempt BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
