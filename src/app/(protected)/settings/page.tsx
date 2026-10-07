"use client";

import { useEffect, useState } from "react";
import { useUserSettingsController } from "@/lib/hooks/useUserSettingsController";
import { useFoodController } from "@/lib/hooks/useFoodController";
import { usePushController } from "@/lib/hooks/usePushController";
import { formatReminderTime, REMINDER_TIME_OPTIONS } from "@/lib/utils/push";
import { ReminderKind } from "@/lib/dataTypes";
import { TIMEZONES } from "@/lib/dataTypes/dropdownData";
import Spinner from "@/app/components/Spinner";

const REMINDER_ROWS: { kind: ReminderKind; label: string; hint: string }[] = [
	{ kind: "workout", label: "Planned workout", hint: "Only on days with an unfinished planned workout" },
	{ kind: "breakfast", label: "After breakfast", hint: "Macros logged so far and what's left" },
	{ kind: "lunch", label: "After lunch", hint: "Macros logged so far and what's left" },
	{ kind: "dinner", label: "After dinner", hint: "Macros logged so far and what's left" },
];

export default function SettingsPage() {

	// controller for user settings
	const uc = useUserSettingsController();
	// controller for tracking history (used here just to clear it)
	const fc = useFoodController();
	// controller for workout reminders on this device
	const pc = usePushController();

	// clear history confirm/loading/result state
	const [clearHistoryOpen, setClearHistoryOpen] = useState(false);
	const [clearHistoryLoading, setClearHistoryLoading] = useState(false);
	const [clearHistoryError, setClearHistoryError] = useState<string | null>(null);
	const [clearHistorySuccess, setClearHistorySuccess] = useState<string | null>(null);

	// account states for saving
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [timezone, setTimezone] = useState("America/Los_Angeles");

	// loading/error handling
	const [accountLoading, setAccountLoading] = useState(false);
	const [accountSuccess, setAccountSuccess] = useState<string | null>(null);
	const [accountError, setAccountError] = useState<string | null>(null);

	// api key loading/error handling
	const [apiKeyError, setApiKeyError] = useState<string | null>(null);
	const [apiKeyCopied, setApiKeyCopied] = useState(false);

	// on open, trigger getting the user account info
	useEffect(() => {
		uc.getUserRecord();
		uc.getApiKeyMetadata();
	}, []);

	// set the values or default
	useEffect(() => {

		if (!uc.userRecord) return;

		setName(uc.userRecord.name ?? "");
		setEmail(uc.userRecord.email ?? "");
		setTimezone(uc.userRecord.timezone ?? "UTC");

	}, [uc.userRecord]);

	// handling account save
	async function handleAccountSave(e: React.FormEvent) {

		e.preventDefault();

		setAccountLoading(true);
		setAccountSuccess(null);
		setAccountError(null);

		if (!name || !email || !timezone) return;

		try {

			await uc.onAccountUpdate(name, email, timezone);
			setAccountSuccess("Account settings saved.");

		} catch {
			setAccountError("Unable to save account settings.");
		} finally {
			setAccountLoading(false);
		}

	}

	// handling api key generation
	async function handleGenerateApiKey() {

		setApiKeyError(null);
		setApiKeyCopied(false);

		try {
			await uc.onGenerateApiKey();
		} catch {
			setApiKeyError("Unable to generate API key.");
		}

	}

	// handling api key revocation
	async function handleRevokeApiKey() {

		setApiKeyError(null);
		setApiKeyCopied(false);

		try {
			await uc.onRevokeApiKey();
		} catch {
			setApiKeyError("Unable to revoke API key.");
		}

	}

	// handling copy-to-clipboard of a freshly generated key
	async function handleCopyApiKey() {

		if (!uc.generatedKey) return;

		try {
			await navigator.clipboard.writeText(uc.generatedKey);
			setApiKeyCopied(true);
		} catch {
			setApiKeyError("Unable to copy API key.");
		}

	}

	// handling clearing of tracking history
	async function handleClearHistory() {

		setClearHistoryLoading(true);
		setClearHistoryError(null);
		setClearHistorySuccess(null);

		try {

			await fc.onClearHistory();
			setClearHistorySuccess("Tracking history cleared.");
			setClearHistoryOpen(false);

		} catch {
			setClearHistoryError("Unable to clear tracking history.");
		} finally {
			setClearHistoryLoading(false);
		}

	}

	const userFormLoading = uc.userLoading && !uc.userRecord;
	const apiKeyFormLoading = uc.apiKeyLoading && !uc.apiKeyMetadata;

	return (
		<div className="mx-auto max-w-3xl px-6 py-10">
			<div className="mb-8">
				<h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
					User Settings
				</h1>
				<p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
					Manage your account details and preferences.
				</p>
			</div>

			<div className="space-y-6">
				<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
					<div className="mb-5">
						<h2 className="text-lg font-medium text-slate-900 dark:text-white">
							Account
						</h2>
						<p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
							Update your display name, email address, and timezone.
						</p>
					</div>

					<form onSubmit={handleAccountSave} className="space-y-4">
						{userFormLoading ? (
							<Spinner />
						) : (
							<>
								<div>
									<label
										htmlFor="name"
										className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
									>
										Name
									</label>
									<input
										id="name"
										type="text"
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="Your name"
										className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-600"
									/>
								</div>

								<div>
									<label
										htmlFor="email"
										className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
									>
										Email
									</label>
									<input
										id="email"
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder="you@example.com"
										className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-600"
									/>
								</div>

								<div>
									<label
										htmlFor="timezone"
										className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
									>
										Timezone
									</label>
									<select
										id="timezone"
										value={timezone}
										onChange={(e) => setTimezone(e.target.value)}
										className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600"
									>
										{TIMEZONES.map((tz) => (
											<option key={tz} value={tz}>
												{tz}
											</option>
										))}
									</select>
								</div>
							</>
						)}

						{accountError && (
							<p className="text-sm text-red-600 dark:text-red-400">
								{accountError}
							</p>
						)}

						{accountSuccess && (
							<p className="text-sm text-emerald-600 dark:text-emerald-400">
								{accountSuccess}
							</p>
						)}

						<div className="flex justify-end">
							<button
								type="submit"
								disabled={accountLoading || userFormLoading}
								className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900"
							>
								{accountLoading ? "Saving..." : "Save Settings"}
							</button>
						</div>
					</form>
				</section>

				<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
					<div className="mb-5">
						<h2 className="text-lg font-medium text-slate-900 dark:text-white">
							API Key
						</h2>
						<p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
							Generate a personal API key to access your data programmatically.
						</p>
					</div>

					{apiKeyFormLoading ? (
						<Spinner />
					) : (
						<div className="space-y-4">
							{uc.generatedKey && (
								<div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
									<p className="text-sm font-medium text-amber-800 dark:text-amber-300">
										Copy this key now. You won&apos;t be able to see it again.
									</p>
									<code className="block break-all rounded-lg bg-white px-3 py-2 text-sm text-slate-900 dark:bg-slate-950 dark:text-slate-100">
										{uc.generatedKey}
									</code>
									<button
										type="button"
										onClick={handleCopyApiKey}
										className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:opacity-90 dark:border-amber-800 dark:bg-slate-950 dark:text-amber-300"
									>
										{apiKeyCopied ? "Copied!" : "Copy to clipboard"}
									</button>
								</div>
							)}

							{uc.apiKeyMetadata?.has_key ? (
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-slate-700 dark:text-slate-200">
											{uc.apiKeyMetadata.key_prefix}&hellip;
										</p>
										{uc.apiKeyMetadata.created_at && (
											<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
												Created {new Date(uc.apiKeyMetadata.created_at).toLocaleDateString()}
											</p>
										)}
									</div>
									<div className="flex gap-2">
										<button
											type="button"
											onClick={handleGenerateApiKey}
											disabled={uc.apiKeyLoading}
											className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
										>
											Regenerate
										</button>
										<button
											type="button"
											onClick={handleRevokeApiKey}
											disabled={uc.apiKeyLoading}
											className="rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
										>
											Revoke
										</button>
									</div>
								</div>
							) : (
								<div className="flex justify-end">
									<button
										type="button"
										onClick={handleGenerateApiKey}
										disabled={uc.apiKeyLoading}
										className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900"
									>
										{uc.apiKeyLoading ? "Generating..." : "Generate API Key"}
									</button>
								</div>
							)}

							{apiKeyError && (
								<p className="text-sm text-red-600 dark:text-red-400">
									{apiKeyError}
								</p>
							)}
						</div>
					)}
				</section>

				<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
					<div className="mb-5">
						<h2 className="text-lg font-medium text-slate-900 dark:text-white">
							Reminders
						</h2>
						<p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
							Get a reminder and a badge on the NutriGym icon on days with a planned workout, plus macro check-ins after meals. Turning reminders on applies to this device; the times apply to all of your devices.
						</p>
					</div>

					{pc.status === "loading" ? (
						<Spinner />
					) : pc.status === "needs_install" ? (
						<p className="text-sm text-slate-600 dark:text-slate-400">
							On iPhone, open NutriGym from your Home Screen to turn on reminders. In Safari, tap Share, then Add to Home Screen.
						</p>
					) : pc.status === "unsupported" ? (
						<p className="text-sm text-slate-600 dark:text-slate-400">
							This browser doesn&apos;t support reminders.
						</p>
					) : pc.status === "unconfigured" ? (
						<p className="text-sm text-slate-600 dark:text-slate-400">
							Reminders aren&apos;t available right now.
						</p>
					) : pc.status === "denied" ? (
						<p className="text-sm text-slate-600 dark:text-slate-400">
							Notifications are blocked for NutriGym. Allow them in your device settings, then come back here.
						</p>
					) : (
						<div className="flex items-center justify-between gap-4">
							<p className="text-sm text-slate-700 dark:text-slate-200">
								{pc.status === "on" ? "Reminders are on." : "Reminders are off."}
							</p>
							<div className="flex gap-2">
								{pc.status === "on" ? (
									<>
										<button
											type="button"
											onClick={pc.sendTest}
											disabled={pc.busy}
											className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
										>
											Send test
										</button>
										<button
											type="button"
											onClick={pc.disable}
											disabled={pc.busy}
											className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
										>
											Turn off
										</button>
									</>
								) : (
									<button
										type="button"
										onClick={pc.enable}
										disabled={pc.busy}
										className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900"
									>
										{pc.busy ? "Turning on..." : "Turn on reminders"}
									</button>
								)}
							</div>
						</div>
					)}

					{pc.status === "on" && pc.preferences && (
						<div className="mt-5 divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-800 dark:border-slate-800">
							{REMINDER_ROWS.map(({ kind, label, hint }) => {
								const value = pc.preferences![`${kind}_time`];
								return (
									<div key={kind} className="flex items-center justify-between gap-4 py-3">
										<div className="min-w-0">
											<label htmlFor={`reminder-${kind}`} className="text-sm font-medium text-slate-700 dark:text-slate-200">
												{label}
											</label>
											<p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
										</div>
										<select
											id={`reminder-${kind}`}
											value={value ?? "off"}
											onChange={(e) => pc.setReminderTime(kind, e.target.value === "off" ? null : Number(e.target.value))}
											className="shrink-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600"
										>
											<option value="off">Off</option>
											{REMINDER_TIME_OPTIONS.map((m) => (
												<option key={m} value={m}>{formatReminderTime(m)}</option>
											))}
										</select>
									</div>
								);
							})}
							<p className="pt-3 text-xs text-slate-500 dark:text-slate-400">
								Meal check-ins use your macro goals, so they only go out once goals are set.
							</p>
						</div>
					)}

					{pc.error && (
						<p className="mt-4 text-sm text-red-600 dark:text-red-400">
							{pc.error}
						</p>
					)}

					{pc.message && (
						<p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
							{pc.message}
						</p>
					)}
				</section>

				<section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900/60 dark:bg-slate-900">
					<div className="mb-5">
						<h2 className="text-lg font-medium text-red-700 dark:text-red-400">
							Danger Zone
						</h2>
						<p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
							Permanently remove data from your account. These actions cannot be undone.
						</p>
					</div>

					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-sm font-medium text-slate-900 dark:text-white">
								Clear tracking history
							</p>
							<p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
								Deletes every food you&apos;ve logged. Your foods, recipes, and weight entries are kept.
							</p>
						</div>

						{!clearHistoryOpen ? (
							<button
								type="button"
								onClick={() => {
									setClearHistoryOpen(true);
									setClearHistoryError(null);
									setClearHistorySuccess(null);
								}}
								className="shrink-0 rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
							>
								Clear history
							</button>
						) : (
							<div className="flex shrink-0 items-center gap-2">
								<button
									type="button"
									onClick={() => setClearHistoryOpen(false)}
									disabled={clearHistoryLoading}
									className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleClearHistory}
									disabled={clearHistoryLoading}
									className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{clearHistoryLoading ? "Clearing..." : "Confirm: delete everything"}
								</button>
							</div>
						)}
					</div>

					{clearHistoryError && (
						<p className="mt-4 text-sm text-red-600 dark:text-red-400">
							{clearHistoryError}
						</p>
					)}

					{clearHistorySuccess && (
						<p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
							{clearHistorySuccess}
						</p>
					)}
				</section>
			</div>
		</div>
	);
}