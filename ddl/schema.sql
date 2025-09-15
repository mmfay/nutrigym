--psql -h localhost -U nutrigym_user -d nutrigym -f schema.sql
--psql -h localhost -U nutrigym_user -d nutrigym -f dummyData.sql

-- Users table
create table if not exists users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,          -- unique email
    name VARCHAR(120) NOT NULL,                  -- full name
    password_hash TEXT NOT NULL,                 -- hashed password
    created_at TIMESTAMP DEFAULT NOW()           -- record created timestamp
);

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

create table if not exists weight (
    user_id uuid not null references users(id) on delete cascade,
    measured_at date not null,             
    weight numeric(6,2) not null,          
    unit text check (unit in ('lb','kg')) default 'lb'
);

-- One weight entry per user per day 
create unique index if not exists idx_weights_user_date on weight (user_id, measured_at)
  include (weight, unit);            -- cover common selects

create table if not exists food (
  id                bigserial primary key,
  name              text not null,            -- apple
  brand             text,                     -- generic or 'orchard ..'
  barcode           text unique,              -- optional (UPC/EAN)
  serving_size      numeric(7,2) not null default 0,
  serving_unit      text,
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

create table if not exists food_tracker (
    user_id uuid not null references users(id) on delete cascade,
    food_id bigserial not null references food(id),
    recorded_at date not null,        
    carbs numeric(6,2) not null, 
    fat numeric(6,2) not null,    
    protein numeric(6,2) not null,   
    calories numeric(6,2) not null,          
    serving_size    numeric(6,2) not null,
    serving_unit    text
);

create index if not exists food_tracker_user_idx    on food_tracker(user_id);

drop table macro_goals;
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
