-- 012_add_english_master_data.sql

-- 1. company_info: add ceo_name_en
ALTER TABLE company_info ADD COLUMN IF NOT EXISTS ceo_name_en TEXT;

-- 2. finished_products: add name_en
ALTER TABLE finished_products ADD COLUMN IF NOT EXISTS name_en TEXT;

-- 3. packaging_components: add name_en
ALTER TABLE packaging_components ADD COLUMN IF NOT EXISTS name_en TEXT;

-- 4. Create packaging_types table to replace local storage
CREATE TABLE IF NOT EXISTS packaging_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed some default packaging types if empty
INSERT INTO packaging_types (name, name_en) 
SELECT '단상자', 'Carton'
WHERE NOT EXISTS (SELECT 1 FROM packaging_types);

INSERT INTO packaging_types (name, name_en) 
SELECT '용기', 'Container'
WHERE NOT EXISTS (SELECT 1 FROM packaging_types LIMIT 1 OFFSET 1);

INSERT INTO packaging_types (name, name_en) 
SELECT '마개', 'Cap'
WHERE NOT EXISTS (SELECT 1 FROM packaging_types LIMIT 1 OFFSET 2);
