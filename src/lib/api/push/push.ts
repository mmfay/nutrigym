import { ApiResult } from "@/lib/dataTypes/results";
import { ReminderPreferences } from "@/lib/dataTypes";
import { getJSON, postJSON, patchJSON, deleteJSON } from "../submissions";

export async function getPushConfig(): Promise<ApiResult<{ public_key: string | null }>> {
	return getJSON("/api/push/subscription");
}

export async function savePushSubscription(subscription: PushSubscriptionJSON): Promise<ApiResult<null>> {
	return postJSON("/api/push/subscription", subscription);
}

export async function deletePushSubscription(endpoint: string): Promise<ApiResult<null>> {
	return deleteJSON("/api/push/subscription", { endpoint });
}

export async function sendTestPush(): Promise<ApiResult<{ sent: number }>> {
	return postJSON("/api/push/test", {});
}

export async function getReminderPreferences(): Promise<ApiResult<ReminderPreferences>> {
	return getJSON("/api/push/preferences");
}

export async function saveReminderPreferences(prefs: ReminderPreferences): Promise<ApiResult<ReminderPreferences>> {
	return patchJSON("/api/push/preferences", prefs);
}