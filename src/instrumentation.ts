const REMINDER_INTERVAL_MS = 5 * 60 * 1000;

declare global {
	// eslint-disable-next-line no-var
	var __reminderTimer: ReturnType<typeof setInterval> | undefined;
}

/**
 * Runs once when the server starts. Checks for due reminders (workout + meal check-ins) every
 * 5 minutes; each device gets each kind at most once per day (see sendDueReminders).
 */
export async function register() {

	if (process.env.NEXT_RUNTIME !== "nodejs") return;
	if (global.__reminderTimer) return;

	const { isPushConfigured, sendDueReminders } = await import("./lib/services/push");

	if (!isPushConfigured()) {
		console.info("Reminders disabled: VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set");
		return;
	}

	const run = async () => {
		try {
			const sent = await sendDueReminders();
			if (sent) console.info(`Reminders sent: ${sent}`);
		} catch (err) {
			console.error("Reminder run failed:", err);
		}
	};

	global.__reminderTimer = setInterval(run, REMINDER_INTERVAL_MS);
	setTimeout(run, 30 * 1000);

}