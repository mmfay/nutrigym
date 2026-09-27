import "server-only";
import { PoolClient } from "pg";
import { ResponseBuilder as R } from "../utils/response";
import { getUser } from "./user";
import { Common } from "../tables/common";
import { Users } from "../tables/users";
import { AuthSessions } from "../tables/auth_sessions";
import { AdminUser, AdminUserPage, User } from "../dataTypes/auth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns the signed in user if they are a sys admin.
 * Throws a 401/403 response otherwise (catch it and return it from the route).
 */
export async function requireSysAdmin(): Promise<User> {

	const user = await getUser();

	if (!user) throw R.unauthorized();

	if (!user.is_sys_admin) throw R.forbidden();

	return user;

}

function toAdminUser(u: Users): AdminUser {
	return {
		id:             u.id!,
		name:           u.name ?? "",
		email:          u.email ?? "",
		is_enabled:     !!u.is_enabled,
		is_sys_admin:   !!u.is_sys_admin,
		email_verified: !!u.email_verified,
		created_at:     u.created_at,
	};
}

/**
 * Loads the target user for an admin action, rejecting invalid ids,
 * missing users, the admin themselves, and other sys admins.
 */
async function findActionableUser(adminId: string, targetId: string, client: PoolClient | null = null): Promise<Users> {

	if (!UUID_RE.test(targetId)) throw R.badRequest("Invalid user id.");

	if (targetId === adminId) throw R.badRequest("You cannot perform this action on your own account.");

	const target = await Users.find(targetId, client);

	if (!target) throw R.notFound("User not found.");

	if (target.is_sys_admin) throw R.forbidden("Sys admin accounts cannot be modified here.");

	return target;

}

export async function listUsers(cursor: string | null, search: string | null): Promise<AdminUserPage> {

	let page;

	try {
		page = await Users.findPage({ cursor, search });
	} catch (err) {
		if (err instanceof Error && err.message === "Invalid cursor") throw R.badRequest("Invalid cursor.");
		throw err;
	}

	return {
		items:      page.items.map(toAdminUser),
		nextCursor: page.nextCursor,
		hasMore:    page.hasMore,
	};

}

/**
 * Enables or disables a user. Disabling also signs them out everywhere.
 */
export async function setUserEnabled(adminId: string, targetId: string, isEnabled: boolean): Promise<AdminUser> {

	return Common.withTransaction(async (client) => {

		const target = await findActionableUser(adminId, targetId, client);

		target.is_enabled = isEnabled;
		await target.update();

		if (!isEnabled) {
			await AuthSessions.deleteByUser(targetId, client);
		}

		return toAdminUser(target);

	});

}

/**
 * Permanently deletes a user. Owned rows (sessions, logs, weight, goals,
 * recipes, meals, api keys, reset tokens) cascade via foreign keys.
 */
export async function deleteUser(adminId: string, targetId: string): Promise<void> {

	await Common.withTransaction(async (client) => {

		await findActionableUser(adminId, targetId, client);

		// ai_daily_usage has no FK to users, so clean it up explicitly
		await client.query(`DELETE FROM ai_daily_usage WHERE user_id = $1`, [targetId]);

		const user = new Users(client);
		user.id = targetId;
		await user.delete();

	});

}