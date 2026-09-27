import "server-only";
import { PoolClient } from "pg";
import { Common } from "./common";
import { SQL } from "@/lib/services/sql";

const TABLE = "auth_sessions";

export class AuthSessions extends Common {

	id:         string | null = null;
	user_id:    string | null = null;
	data:       Record<string, unknown> | null = null;
	created_at: Date | null = null;
	expires_at: Date | null = null;

	constructor(client: PoolClient | null = null) {
		super(client);
	}

	async insert(): Promise<this> {

		if (!this.id)         throw new Error("id required to insert");
		if (!this.user_id)    throw new Error("user_id required to insert");
		if (!this.expires_at) throw new Error("expires_at required to insert");

		const { sql, params } = SQL()
			.insertInto(TABLE)
			.values({
				id:         this.id,
				user_id:    this.user_id,
				data:       JSON.stringify(this.data ?? {}),
				expires_at: this.expires_at,
			})
			.returning("id", "user_id", "data", "created_at", "expires_at")
			.build();

		const row = await this.fetchOne(sql, params);

		if (!row) throw new Error("Insert failed: no row returned");

		this.created_at = row.created_at as Date;

		return this;

	}

	async delete(): Promise<void> {

		if (!this.id) throw new Error("id required to delete");

		const { sql, params } = SQL()
			.deleteFrom(TABLE)
			.where("id = ?", this.id)
			.build();

		await this.execute(sql, params);

	}

	// --- Static finders ---

	static async find(id: string, client: PoolClient | null = null): Promise<AuthSessions | null> {

		const temp = new AuthSessions(client);

		const { sql, params } = SQL()
			.select(TABLE)
			.where("id = ?", id)
			.build();

		const row = await temp.fetchOne(sql, params);

		return AuthSessions.fromRow(row, client);

	}

	static async findByUser(userId: string, client: PoolClient | null = null): Promise<AuthSessions[]> {

		const temp = new AuthSessions(client);

		const { sql, params } = SQL()
			.select(TABLE)
			.where("user_id = ?", userId)
			.orderBy("created_at", "DESC")
			.build();

		const rows = await temp.fetchAll(sql, params);

		return rows.map(r => AuthSessions.fromRow(r, client)!);

	}

	static async deleteByUser(userId: string, client: PoolClient | null = null): Promise<void> {

		const temp = new AuthSessions(client);

		const { sql, params } = SQL()
			.deleteFrom(TABLE)
			.where("user_id = ?", userId)
			.build();

		await temp.execute(sql, params);

	}

	static async deleteExpired(client: PoolClient | null = null): Promise<void> {

		const temp = new AuthSessions(client);

		const { sql, params } = SQL()
			.deleteFrom(TABLE)
			.where("expires_at < now()")
			.build();

		await temp.execute(sql, params);

	}

}