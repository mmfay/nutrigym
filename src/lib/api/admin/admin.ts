import { AdminUser, AdminUserPage } from "@/lib/dataTypes/auth";
import { getJSON, patchJSON, deleteJSON } from "../submissions";
import { ApiResult } from "@/lib/dataTypes/results";

/**
 * Get a page of users (newest first), optionally filtered by name/email
 */
export async function getAdminUsers(cursor?: string | null, search?: string | null): Promise<ApiResult<AdminUserPage>> {
	return getJSON("/api/admin/users", { cursor, search: search || undefined });
}

/**
 * Enable or disable a user account
 */
export async function setAdminUserEnabled(id: string, isEnabled: boolean): Promise<ApiResult<AdminUser>> {
	return patchJSON(`/api/admin/users/${encodeURIComponent(id)}`, { is_enabled: isEnabled });
}

/**
 * Permanently delete a user account
 */
export async function deleteAdminUser(id: string): Promise<ApiResult<null>> {
	return deleteJSON(`/api/admin/users/${encodeURIComponent(id)}`);
}