-- Insert the Rider (if not exists, you might need to handle duplicates or clear table first)
INSERT INTO riders (id, name, phone)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Juan Dela Cruz', '+639171234567')
ON CONFLICT (id) DO NOTHING;

-- Active Orders (Pending / En Route)
INSERT INTO orders (id, order_no, rider_id, customer_name, address, cod_amount, status, payment_method, payment_status, created_at)
VALUES 
  (gen_random_uuid(), 'ORD-1001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Maria Clara', '123 Rizal St, Malate, Manila', 500.00, 'PENDING', 'CASH', 'PENDING', NOW()),
  (gen_random_uuid(), 'ORD-1002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Jose Rizal', '456 Kalaw Ave, Ermita, Manila', 1250.50, 'EN_ROUTE', 'CASH', 'PENDING', NOW()),
  (gen_random_uuid(), 'ORD-1003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Andres Bonifacio', '789 Tondo, Manila', 300.00, 'ARRIVED', 'CASH', 'PENDING', NOW());

-- Completed Orders (For Dashboard Stats - Today)
INSERT INTO orders (id, order_no, rider_id, customer_name, address, cod_amount, status, payment_method, payment_status, completed_at, created_at)
VALUES 
  (gen_random_uuid(), 'ORD-0998', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Emilio Aguinaldo', 'Cavite St, Manila', 1500.00, 'COMPLETED', 'QRPH', 'PAID', NOW(), NOW() - INTERVAL '2 hours'),
  (gen_random_uuid(), 'ORD-0999', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Apolinario Mabini', 'Batangas St, Manila', 750.00, 'COMPLETED', 'CASH', 'PAID', NOW(), NOW() - INTERVAL '1 hour');

-- Completed Orders (Yesterday - Should not show in Daily Summary)
INSERT INTO orders (id, order_no, rider_id, customer_name, address, cod_amount, status, payment_method, payment_status, completed_at, created_at)
VALUES 
  (gen_random_uuid(), 'ORD-0900', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Gabriela Silang', 'Ilocos St, Manila', 2000.00, 'COMPLETED', 'CASH', 'PAID', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');
