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

-- Sessions (stateful, opaque cookie "sid")
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
