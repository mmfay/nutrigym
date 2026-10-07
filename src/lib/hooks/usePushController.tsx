"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	deletePushSubscription,
	getPushConfig,
	getReminderPreferences,
	savePushSubscription,
	saveReminderPreferences,
	sendTestPush,
} from "../api/push/push";
import { ReminderKind, ReminderPreferences } from "../dataTypes";
import {
	getCurrentPushSubscription,
	isPushSupported,
	needsHomeScreenInstall,
	SERVICE_WORKER_URL,
	setIconBadge,
	syncIconBadge,
	urlBase64ToUint8Array,
	WORKOUTS_CHANGED_EVENT,
} from "../utils/push";

export type PushStatus =
	| "loading"
	| "unsupported"		// browser can't do web push
	| "needs_install"	// iOS Safari tab: must be added to the home screen first
	| "unconfigured"	// server has no VAPID keys
	| "denied"			// user blocked notifications
	| "off"
	| "on";

export type PushController = {
	status: PushStatus;
	busy: boolean;
	error: string | null;
	message: string | null;
	enable: () => Promise<void>;
	disable: () => Promise<void>;
	sendTest: () => Promise<void>;

	// reminder times, shared by all of the user's devices
	preferences: ReminderPreferences | null;
	setReminderTime: (kind: ReminderKind, minutes: number | null) => Promise<void>;
};

/**
 * Workout reminder settings for this device.
 */
export function usePushController(): PushController {

	const [status, setStatus] = useState<PushStatus>("loading");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [preferences, setPreferences] = useState<ReminderPreferences | null>(null);

	const publicKeyRef = useRef<string | null>(null);
	const aliveRef = useRef(true);

	useEffect(() => {
		aliveRef.current = true;
		return () => {
			aliveRef.current = false;
		};
	}, []);

	useEffect(() => {
		getReminderPreferences()
			.then((res) => aliveRef.current && res.ok && setPreferences(res.data ?? null))
			.catch(() => undefined);
	}, []);

	useEffect(() => {

		(async () => {

			if (needsHomeScreenInstall()) return setStatus("needs_install");
			if (!isPushSupported()) return setStatus("unsupported");

			try {

				const res = await getPushConfig();
				if (!aliveRef.current) return;

				publicKeyRef.current = res.ok ? res.data?.public_key ?? null : null;
				if (!publicKeyRef.current) return setStatus("unconfigured");

				await navigator.serviceWorker.register(SERVICE_WORKER_URL);

				if (Notification.permission === "denied") return setStatus("denied");

				const sub = await getCurrentPushSubscription();

				// re-send so the server has it under this account even if it was cleaned up or the device switched users
				if (sub) await savePushSubscription(sub.toJSON());

				if (aliveRef.current) setStatus(sub ? "on" : "off");

			} catch {
				if (aliveRef.current) setStatus("unsupported");
			}

		})();

	}, []);

	const enable = useCallback(async () => {

		setError(null);
		setMessage(null);

		// ask first, while we're still inside the tap (iOS requires a user gesture)
		const permission = await Notification.requestPermission();

		if (permission !== "granted") {
			setStatus(permission === "denied" ? "denied" : "off");
			return;
		}

		setBusy(true);

		try {

			const reg = await navigator.serviceWorker.ready;

			const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(publicKeyRef.current!),
			});

			const res = await savePushSubscription(sub.toJSON());
			if (!aliveRef.current) return;

			if (!res.ok) {
				await sub.unsubscribe();
				setError(res.message);
				return;
			}

			setStatus("on");
			setMessage("Reminders are on for this device.");
			await syncIconBadge();

		} catch {
			if (aliveRef.current) setError("Couldn't turn on reminders on this device.");
		} finally {
			if (aliveRef.current) setBusy(false);
		}

	}, []);

	const disable = useCallback(async () => {

		setError(null);
		setMessage(null);
		setBusy(true);

		try {

			const sub = await getCurrentPushSubscription();

			if (sub) {
				await deletePushSubscription(sub.endpoint);
				await sub.unsubscribe();
			}

			await setIconBadge(0);

			if (aliveRef.current) setStatus("off");

		} catch {
			if (aliveRef.current) setError("Couldn't turn off reminders.");
		} finally {
			if (aliveRef.current) setBusy(false);
		}

	}, []);

	const sendTest = useCallback(async () => {

		setError(null);
		setMessage(null);
		setBusy(true);

		try {

			const res = await sendTestPush();
			if (!aliveRef.current) return;

			if (res.ok) setMessage(res.message);
			else setError(res.message);

		} finally {
			if (aliveRef.current) setBusy(false);
		}

	}, []);

	// saves right away; puts the old value back if the server rejects it
	const setReminderTime = useCallback(async (kind: ReminderKind, minutes: number | null) => {

		if (!preferences) return;

		const previous = preferences;
		const next = { ...preferences, [`${kind}_time`]: minutes };

		setError(null);
		setMessage(null);
		setPreferences(next);

		try {

			const res = await saveReminderPreferences(next);
			if (!aliveRef.current) return;

			if (!res.ok) {
				setPreferences(previous);
				setError(res.message);
			}

		} catch {
			if (aliveRef.current) {
				setPreferences(previous);
				setError("Couldn't save reminder time.");
			}
		}

	}, [preferences]);

	return { status, busy, error, message, enable, disable, sendTest, preferences, setReminderTime };
}

/**
 * Keeps the home screen icon badge in step with today's unfinished planned workouts
 * while the app is open: on load, when it comes back to the foreground, and after workout changes.
 */
export function useIconBadgeSync(enabled: boolean) {

	useEffect(() => {

		if (!enabled) return;

		syncIconBadge();

		const onVisible = () => document.visibilityState === "visible" && syncIconBadge();
		const onChange = () => syncIconBadge();

		document.addEventListener("visibilitychange", onVisible);
		window.addEventListener(WORKOUTS_CHANGED_EVENT, onChange);

		return () => {
			document.removeEventListener("visibilitychange", onVisible);
			window.removeEventListener(WORKOUTS_CHANGED_EVENT, onChange);
		};

	}, [enabled]);

}