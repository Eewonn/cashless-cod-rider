ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS completed_latitude double precision,
ADD COLUMN IF NOT EXISTS completed_longitude double precision,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;
