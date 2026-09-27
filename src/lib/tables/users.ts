import "server-only";
import { PoolClient } from "pg";
import { Common } from "./common";
import { CursorPage, encodeCursor, decodeCursor } from "./cursor";
import { SQL } from "@/lib/services/sql";

const TABLE = "users";
const PAGE_SIZE = 20;

export type UserPage = CursorPage<Users>;

export class Users extends Common {

	id:                            string | null = null;
	email:                         string | null = null;
	name:                          string | null = null;
	password_hash:                 string | null = null;
	is_enabled:                    boolean | null = null;
	is_sys_admin:                  boolean | null = null;
	email_verified:                boolean | null = null;
	email_verified_at:             Date | null = null;
	email_verification_token_hash: string | null = null;
	email_verification_expires_at: Date | null = null;
	timezone:                      string | null = null;
	created_at:                    Date | null = null;

	constructor(client: PoolClient | null = null) {
		super(client);
	}

	async insert(): Promise<this> {

		const { sql, params } = SQL()
			.insertInto(TABLE)
			.values({
				email:         this.email,
				name:          this.name,
				password_hash: this.password_hash,
			})
			.returning("id", "email", "name", "created_at")
			.build();

		const row = await this.fetchOne(sql, params);

		if (!row) throw new Error("Insert failed: no row returned");

		this.id         = row.id as string;
		this.created_at = row.created_at as Date;

		return this;

	}

	async update(): Promise<this> {

		if (!this.id) throw new Error("id required to update");

		const { sql, params } = SQL()
			.update(TABLE)
			.set({
				name:      this.name,
				email:     this.email,
				timezone:  this.timezone,
				is_enabled: this.is_enabled,
			})
			.where("id = ?", this.id)
			.returning("id", "name", "email", "timezone", "is_enabled")
			.build();

		const row = await this.fetchOne(sql, params);

		if (!row) throw new Error("Update failed: no row returned");

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

	static async find(id: string, client: PoolClient | null = null): Promise<Users | null> {

		const temp = new Users(client);

		const { sql, params } = SQL()
			.select(TABLE)
			.where("id = ?", id)
			.build();

		const row = await temp.fetchOne(sql, params);

		return Users.fromRow(row, client);

	}

	static async findByEmail(email: string, client: PoolClient | null = null): Promise<Users | null> {

		const temp = new Users(client);

		const { sql, params } = SQL()
			.select(TABLE)
			.where("LOWER(email) = LOWER(?)", email)
			.build();

		const row = await temp.fetchOne(sql, params);

		return Users.fromRow(row, client);

	}

	static async findAll(client: PoolClient | null = null): Promise<Users[]> {

		const temp = new Users(client);

		const { sql, params } = SQL()
			.select(TABLE)
			.orderBy("created_at", "DESC")
			.build();

		const rows = await temp.fetchAll(sql, params);

		return rows.map(r => Users.fromRow(r, client)!);

	}

	static async findPage(
		options: {
			cursor?:     string | null;
			search?:     string | null;
			email?:      string | null;
			name?:       string | null;
			is_enabled?: boolean | null;
		} = {},
		client: PoolClient | null = null
	): Promise<UserPage> {

		const temp = new Users(client);

		const builder = SQL()
			.select(TABLE)
			.columns("id", "email", "name", "is_enabled", "is_sys_admin", "email_verified", "created_at", "created_at::text AS cursor_ts");

		// cursor stores { created_at, id } of the last seen row (newest first).
		// created_at is kept as raw text so it round-trips without JS Date timezone shifts.
		if (options.cursor) {
			const payload = decodeCursor(options.cursor);
			builder.where("(created_at, id) < (?::timestamp, ?::uuid)", payload.created_at, payload.id);
		}

		if (options.search)     builder.where("(email ILIKE ? OR name ILIKE ?)", `%${options.search}%`, `%${options.search}%`);
		if (options.email)      builder.where("email ILIKE ?", `%${options.email}%`);
		if (options.name)       builder.where("name ILIKE ?",  `%${options.name}%`);
		if (options.is_enabled != null) builder.where("is_enabled = ?", options.is_enabled);

		const { sql, params } = builder
			.orderBy("created_at", "DESC")
			.orderBy("id", "DESC")
			.limit(PAGE_SIZE + 1)
			.build();

		const rows = await temp.fetchAll(sql, params);

		const hasMore = rows.length > PAGE_SIZE;
		const page    = rows.slice(0, PAGE_SIZE);
		const last    = page[page.length - 1];

		return {
			items:      page.map(r => Users.fromRow(r, client)!),
			nextCursor: hasMore ? encodeCursor({ created_at: last.cursor_ts, id: last.id }) : null,
			hasMore,
		};

	}

}