import 'server-only';
import { Pool } from 'pg';

// attaching our pool to global object to avoid file reloads
declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

// create the connection and pool
const pool = global.__pgPool ?? new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DB,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  max: 10,
});

// in production, we skip this since we dont have the hot reloads
if (process.env.NODE_ENV !== 'production') global.__pgPool = pool;

export default pool;