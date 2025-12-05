-- Enable PostGIS for geography type
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE riders (
  id uuid PRIMARY KEY,
  name text,
  phone text
);

CREATE TABLE orders (
  id uuid PRIMARY KEY,
  order_no text,
  rider_id uuid REFERENCES riders(id),
  customer_name text,
  address text,
  cod_amount numeric,
  status text,            -- PENDING / EN_ROUTE / ARRIVED / PAYMENT / COMPLETED / FAILED
  payment_method text,    -- CASH / QRPH
  payment_status text,    -- PENDING / PAID / FAILED
  qr_id text,
  pod_url text,
  gps_point geography,
  created_at timestamp default now()
);

CREATE TABLE events (
  id uuid PRIMARY KEY,
  order_id uuid REFERENCES orders(id),
  type text,              -- status_change, payment, pod_uploaded, fallback_to_cash
  metadata jsonb,
  created_at timestamp default now()
);

CREATE TABLE webhook_logs (
  id uuid PRIMARY KEY,
  source text,
  payload jsonb,
  created_at timestamp default now()
);
