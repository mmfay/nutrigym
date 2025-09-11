--psql -h localhost -U nutrigym_user -d nutrigym -f schema.sql
--psql -h localhost -U nutrigym_user -d nutrigym -f dummyData.sql
-- Drop table if exists
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,          -- unique email
    name VARCHAR(120) NOT NULL,                  -- full name
    password_hash TEXT NOT NULL,                 -- hashed password
    created_at TIMESTAMP DEFAULT NOW()           -- record created timestamp
);
