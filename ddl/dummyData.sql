-- Insert dummy users
insert into users (id, email, name, password_hash)
values
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 'test@example.com', 'Test User', 'password123');

insert into weight (user_id, measured_at, weight, unit)
values 
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', '2025-09-07', 182.4, 'lb'),
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', '2025-09-09', 182.1, 'lb'),
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', '2025-09-10', 182.4, 'lb'),
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', '2025-09-11', 182.1, 'lb'),
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', '2025-09-12', 182.4, 'lb'),
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', '2025-09-13', 182.1, 'lb');

-- Seed foods with fixed IDs
insert into food (name, brand, barcode, serving_size, serving_unit, serving_type, count_name, protein, carbs, fat, calories) values
  ('Apple',   'Generic', '0000000000001', 182.00, 'g', 'COUNT', 'Each', 0.50, 25.10, 0.30,  95.00),
  ('Banana', 'Generic', '0000000000002', 118.00, 'g', 'COUNT', 'Each', 1.30, 27.00, 0.30, 105.00),
  ('Chicken Breast', 'Generic', '0000000000003', 100.00, 'g', 'MEASURE', 31.00, 0.00, 3.60, 165.00),
  ('Milk 2%', 'Dairy Pure', '0000000000004', 244.00, 'ml', 'MEASURE', 8.00, 12.00, 5.00, 122.00),
  ('Olive Oil', 'Generic', '0000000000005', 14.00,  'g', 'MEASURE', 0.00,  0.00, 13.50, 119.00),
  ('Oats', 'Generic', '0000000000006', 40.00,  'g', 'MEASURE', 5.00, 27.00, 3.00, 150.00),
  ('Greek Yogurt (nonfat)', 'Generic', '0000000000007', 170.00, 'g', 'MEASURE', 17.00,  6.00, 0.00, 100.00),
  ('Peanut Butter', 'Generic', '0000000000008', 32.00, 'g', 'MEASURE', 8.00,  7.00, 16.00, 190.00),
  ('Rice (cooked, white)', 'Generic', '0000000000009', 158.00, 'g', 'MEASURE', 4.30, 45.00, 0.40, 205.00),
  ('Egg, Large', 'Generic', '0000000000010', 1.00,   'g', 'COUNT', 'Each', 6.30, 0.40, 4.80,  72.00),
  ('Protein Bar - Chocolate', 'FitBrand', '0000000000011', 60.00, 'g', 'COUNT', 'Bar', 20.00, 23.00, 7.00, 250.00),
  ('Orange', 'Generic', '0000000000012', 131.00, 'g', 'COUNT', 'Each', 1.20, 15.40, 0.20,  62.00);

insert into food_tracker (meal, user_id, food_id, recorded_at, carbs, fat, protein, calories, serving_size, serving_unit) values
  (0, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-11', 20, 20, 20, 100, 2, 'g'),
  (0, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-11', 20, 20, 20, 100, 2, 'g'),
  (0, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-11', 20, 20, 20, 100, 2, 'g'),
  (1, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-11', 20, 20, 20, 100, 2, 'g'),
  (1, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-11', 20, 20, 20, 100, 2, 'g'),
  (1, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-11', 20, 20, 20, 100, 2, 'g'),
  (1, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-11', 20, 20, 20, 100, 2, 'g'),
  (2, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-11', 20, 20, 20, 100, 2, 'g'),
  (2, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-11', 20, 20, 20, 100, 2, 'g'),
  (2, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-12', 20, 20, 20, 100, 2, 'g'),
  (2, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-12', 20, 20, 20, 100, 2, 'g'),
  (3, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-12', 20, 20, 20, 100, 2, 'g'),
  (3, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-12', 20, 20, 20, 100, 2, 'g'),
  (3, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-12', 20, 20, 20, 100, 2, 'g'),
  (3, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-12', 20, 20, 20, 100, 2, 'g'),
  (0, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-12', 20, 20, 20, 100, 2, 'g'),
  (0, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-12', 20, 20, 20, 100, 2, 'g'),
  (0, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-12', 20, 20, 20, 100, 2, 'g'),
  (0, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-13', 20, 20, 20, 100, 2, 'g'),
  (1, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-13', 20, 20, 20, 100, 2, 'g'),
  (1, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-13', 20, 20, 20, 100, 2, 'g'),
  (1, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-13', 20, 20, 20, 100, 2, 'g'),
  (1, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-13', 20, 20, 20, 100, 2, 'g'),
  (2, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-13', 20, 20, 20, 100, 2, 'g'),
  (2, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-13', 20, 20, 20, 100, 2, 'g'),
  (2, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-13', 20, 20, 20, 100, 2, 'g'),
  (2, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-13', 20, 20, 20, 100, 2, 'g'),
  (3, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-15', 20, 20, 20, 100, 2, 'g'),
  (3, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-15', 20, 20, 20, 100, 2, 'g'),
  (3, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-15', 20, 20, 20, 100, 2, 'g'),
  (3, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-15', 20, 20, 20, 100, 2, 'g'),
  (0, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-15', 20, 20, 20, 100, 2, 'g'),
  (0, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-15', 20, 20, 20, 100, 2, 'g'),
  (0, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-15', 20, 20, 20, 100, 2, 'g'),
  (0, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-15', 20, 20, 20, 100, 2, 'g'),
  (0, 'dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 1, '2025-09-15', 20, 20, 20, 100, 2, 'g');

insert into macro_goals (user_id, date_from, calories, carbs, fat, protein) values
  ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e','2025-09-11',2000,200,70,170);