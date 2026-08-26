-- 011_create_storage_buckets.sql
-- Create storage bucket for EPR Documents

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('epr_documents', 'epr_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the bucket (Allow all operations for now, assuming public access or anon access for MVP)
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT
USING (bucket_id = 'epr_documents');

CREATE POLICY "Allow public insert access" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'epr_documents');

CREATE POLICY "Allow public update access" ON storage.objects
FOR UPDATE
USING (bucket_id = 'epr_documents');

CREATE POLICY "Allow public delete access" ON storage.objects
FOR DELETE
USING (bucket_id = 'epr_documents');
