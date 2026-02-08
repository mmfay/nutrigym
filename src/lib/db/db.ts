import "server-only";
import { Pool } from "pg";

declare global {
	// eslint-disable-next-line no-var
	var __pgPool: Pool | undefined;
}

function makePool() {

	// Prefer DATABASE_URL if present (best for docker/prod)
	if (process.env.DATABASE_URL) {
		return new Pool({
		connectionString: process.env.DATABASE_URL,
		max: 10,
		// ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
		});
	}

	// Fallback to discrete vars (nice for local dev)
	return new Pool({
		host: process.env.PG_HOST || "localhost",
		port: parseInt(process.env.PG_PORT || "5432", 10),
		database: process.env.POSTGRES_DB,
		user: process.env.POSTGRES_USER,
		password: process.env.POSTGRES_PASSWORD,
		max: 10,
	});
}

const pool = global.__pgPool ?? makePool();

if (process.env.NODE_ENV !== "production") global.__pgPool = pool;

export default pool;