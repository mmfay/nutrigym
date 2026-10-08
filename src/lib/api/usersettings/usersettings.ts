import { User } from "@/lib/dataTypes/auth";
import { deleteJSON, getJSON, patchJSON, postFormData } from "../submissions";
import { ApiResult } from "@/lib/dataTypes/results";

/**
 * Get User Record
 */
export async function getUserRecord(): Promise<ApiResult<User>> {
	return getJSON("/api/usersettings");
}

/**
 * Update User Record
 */
export async function updateUserRecord(updatedRecord: User): Promise<ApiResult<User>> {
	return patchJSON("/api/usersettings", updatedRecord);
}

/**
 * Upload / replace the profile photo
 */
export async function uploadAvatar(image: Blob): Promise<ApiResult<{ avatar_version: string }>> {
	const form = new FormData();
	form.append("file", image, "avatar.jpg");
	return postFormData("/api/usersettings/avatar", form);
}

/**
 * Remove the profile photo
 */
export async function removeAvatar(): Promise<ApiResult<{ avatar_version: null }>> {
	return deleteJSON("/api/usersettings/avatar");
}