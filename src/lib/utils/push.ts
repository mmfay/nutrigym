/**
 * Browser-side helpers for workout reminder pushes and the home screen icon badge.
 */
import { getTodaysScheduledWorkouts } from "../api/workouts/schedule";
import { deletePushSubscription } from "../api/push/push";

export const SERVICE_WORKER_URL = "/sw.js";

// fired after anything that changes today's planned / finished workouts, so the badge can refresh
export const WORKOUTS_CHANGED_EVENT = "nutrigym:workouts-changed";

export function notifyWorkoutsChanged() {
	window.dispatchEvent(new Event(WORKOUTS_CHANGED_EVENT));
}

export function isPushSupported() {
	return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

// iOS only allows push for web apps opened from the home screen
export function needsHomeScreenInstall() {

	if (typeof window === "undefined") return false;

	const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
	const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;

	return ios && !standalone;

}

// VAPID public keys come base64url-encoded; pushManager.subscribe wants bytes
export function urlBase64ToUint8Array(base64: string) {
	const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
	const raw = atob(padded);
	return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function getCurrentPushSubscription() {
	if (!isPushSupported()) return null;
	const reg = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
	return (await reg?.pushManager.getSubscription()) ?? null;
}

export async function setIconBadge(count: number) {

	if (!("setAppBadge" in navigator)) return;

	try {
		if (count > 0) await navigator.setAppBadge(count);
		else await navigator.clearAppBadge();
	} catch {
		// badge isn't allowed (e.g. notifications not granted); nothing to do
	}

}

/**
 * Sets the icon badge to today's unfinished planned workouts. Only runs once the
 * user has granted notifications, since that's what lets iOS show a badge.
 */
export async function syncIconBadge() {

	if (!("setAppBadge" in navigator) || !("Notification" in window) || Notification.permission !== "granted") return;

	try {
		const res = await getTodaysScheduledWorkouts();
		if (res.ok) await setIconBadge(res.data?.length ?? 0);
	} catch {
		// offline; keep the current badge
	}

}

/**
 * Stops reminders on this device (used on logout so the next account doesn't get them).
 */
export async function disablePushOnThisDevice() {

	try {

		const sub = await getCurrentPushSubscription();

		if (sub) {
			await deletePushSubscription(sub.endpoint).catch(() => undefined);
			await sub.unsubscribe();
		}

		await setIconBadge(0);

	} catch {
		// best effort
	}

}

// "8:00 AM" for 480 minutes after midnight
export function formatReminderTime(minutes: number) {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

// reminder time choices: every 15 minutes, 12:00 AM to 11:45 PM
export const REMINDER_TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => i * 15);