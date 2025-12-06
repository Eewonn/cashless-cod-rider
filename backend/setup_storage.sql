-- 1. Create the 'pod' bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pod', 'pod', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS (Row Level Security) on objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Allow public read access to the 'pod' bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'pod' );

-- 4. Allow uploads to the 'pod' bucket (for the anon key used in backend)
CREATE POLICY "Allow Uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'pod' );
