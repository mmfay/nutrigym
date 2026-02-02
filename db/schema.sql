drop table if exists users cascade;

-- Users table
create table if not exists users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,          -- unique email
    name VARCHAR(120) NOT NULL,                  -- full name
    password_hash TEXT NOT NULL,                 -- hashed password
    created_at TIMESTAMP DEFAULT NOW()           -- record created timestamp
);

insert into users (id, email, name, password_hash)
values
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 'test@example.com', 'Test User', 'password123');

drop table if exists auth_sessions cascade;

-- Sessions 
create table if not exists auth_sessions (
    id         text primary key,                                        -- opaque sid (e.g., nanoid)
    user_id    uuid not null references users(id) on delete cascade,    -- match users.id
    data       jsonb not null default '{}',                             -- tiny bag: roles, company_id
    created_at timestamptz not null default now(),
    expires_at timestamptz not null
);

create index if not exists auth_sessions_user_idx    on auth_sessions(user_id);
create index if not exists auth_sessions_expires_idx on auth_sessions(expires_at);

drop table if exists weight cascade;

create table if not exists weight (
    user_id uuid not null references users(id) on delete cascade,
    measured_at date not null,             
    weight numeric(6,2) not null,          
    unit text check (unit in ('lb','kg')) default 'lb'
);

-- One weight entry per user per day 
create unique index if not exists idx_weights_user_date on weight (user_id, measured_at)
  include (weight, unit);            -- cover common selects

insert into weight (user_id, measured_at, weight, unit)
values 
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', '2025-09-07', 182.4, 'lb'),
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', '2025-09-09', 182.1, 'lb'),
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', '2025-09-10', 182.4, 'lb'),
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', '2025-09-11', 182.1, 'lb'),
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', '2025-09-12', 182.4, 'lb'),
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', '2025-09-13', 182.1, 'lb');

drop table if exists food cascade;

create table if not exists food (
  id                bigserial primary key,
  name              text not null,            -- apple
  brand             text,                     -- generic or 'orchard ..'
  barcode           text unique,              -- optional (UPC/EAN)
  serving_size      numeric(7,2) not null default 0,
  serving_unit      text,
  serving_type      text not null,
  count_name        text,
  protein           numeric(7,2) not null default 0,
  carbs             numeric(7,2) not null default 0,
  fat               numeric(7,2) not null default 0,
  calories          numeric(7,2) not null default 0,  -- label calories, not computed
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint chk_food_macros_nonneg
    check (
      protein >= 0 and carbs >= 0 and fat >= 0 and calories >= 0
    )
);

create index if not exists idx_foods_barcode on food (barcode);

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

drop table if exists food_tracker cascade;

create table if not exists food_tracker (
	  id                	bigserial primary key,
	  meal 				        int not null, 
    user_id             uuid not null references users(id) on delete cascade,
    food_id             bigserial not null references food(id),
    recorded_at         date not null,        
    carbs               numeric(6,2) not null, 
    fat                 numeric(6,2) not null,    
    protein             numeric(6,2) not null,   
    calories            numeric(6,2) not null,          
    serving_size        numeric(6,2) not null,
    serving_unit        text
);

create index if not exists food_tracker_user_idx    on food_tracker(user_id);

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

drop table if exists macro_goals cascade;

create table if not exists macro_goals (
    user_id uuid not null references users(id) on delete cascade,
    date_from date not null,   
    date_to date,     
    carbs numeric(6,2) not null, 
    fat numeric(6,2) not null,    
    protein numeric(6,2) not null,
    calories numeric(6,2) not null
);

create index if not exists macro_goal_user_idx    on macro_goals(user_id);

insert into macro_goals (user_id, date_from, calories, carbs, fat, protein) values
  ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e','2025-09-11',2000,200,70,170);

CREATE OR REPLACE VIEW v_food_log AS
	SELECT
		ft.id                    AS entry_id,
		ft.user_id,
		ft.meal,
		CASE ft.meal
			WHEN 0 THEN 'breakfast'
			WHEN 1 THEN 'lunch'
			WHEN 2 THEN 'dinner'
			WHEN 3 THEN 'snack'
			ELSE 'unknown'
		END                      AS meal_name,
		ft.recorded_at,
		-- logged amounts (what the user actually tracked)
		ft.serving_size          AS logged_serving_size,
		ft.serving_unit          AS logged_serving_unit,
		ft.protein               AS protein_logged,
		ft.carbs                 AS carbs_logged,
		ft.fat                   AS fat_logged,
		ft.calories              AS calories_logged,

		-- food catalog details
		f.id                     AS food_id,
		f.name                   AS food_name,
		f.brand,
		f.barcode,
		f.serving_size           AS food_serving_size,
		f.serving_unit           AS food_serving_unit,
		f.protein                AS food_protein_per_serving,
		f.carbs                  AS food_carbs_per_serving,
		f.fat                    AS food_fat_per_serving,
		f.calories               AS food_calories_per_serving,

		-- how many label servings the logged serving represents
		CASE
			WHEN f.serving_size > 0 THEN ft.serving_size / f.serving_size
			ELSE NULL
		END                      AS servings_equivalent
	FROM food_tracker ft
	JOIN food f ON f.id = ft.food_id;