-- 001_update_packaging_components.sql
-- 기존 type(충진/포장부자재) 컬럼을 삭제하고, 포장형태(part_type)와 서브컴포넌트(sub_components) 컬럼을 추가합니다.

ALTER TABLE packaging_components 
  DROP COLUMN IF EXISTS type;
  
ALTER TABLE packaging_components
  ADD COLUMN IF NOT EXISTS part_type text,
  ADD COLUMN IF NOT EXISTS sub_components jsonb DEFAULT '[]'::jsonb;
