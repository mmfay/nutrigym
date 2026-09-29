"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Circle, CircleDot, Play, Trash2, X } from "lucide-react";
import { CalendarWorkout, ScheduledWorkout, ScheduledWorkoutStatus, WorkoutTemplate } from "@/lib/dataTypes";
import { WorkoutCalendarController } from "@/lib/hooks/useWorkoutCalendarController";
import { WorkoutController } from "@/lib/hooks/useWorkoutController";
import { formatShortDate } from "@/lib/utils/date";
import { SessionDetail } from "./WorkoutHistory";
import { btnPrimary, card, errorBox, input, muted } from "./ui";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// every status carries an icon + label, never color alone
const STATUS: Record<ScheduledWorkoutStatus, { label: string; icon: typeof Check; chip: string; dot: string }> = {
	completed: {
		label: "Done",
		icon: Check,
		chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
		dot: "bg-emerald-500",
	},
	in_progress: {
		label: "In progress",
		icon: CircleDot,
		chip: "bg-indigo-500 text-white",
		dot: "bg-indigo-500",
	},
	planned: {
		label: "Planned",
		icon: Circle,
		chip: "border border-indigo-300 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300",
		dot: "border-2 border-indigo-500",
	},
	missed: {
		label: "Missed",
		icon: X,
		chip: "bg-slate-200 text-slate-600 line-through dark:bg-slate-800 dark:text-slate-400",
		dot: "bg-slate-400",
	},
};

type DayItem =
	| { kind: "scheduled"; item: ScheduledWorkout }
	| { kind: "session"; item: CalendarWorkout };

function itemStatus(d: DayItem): ScheduledWorkoutStatus {
	return d.kind === "scheduled" ? d.item.status : "completed";
}

function itemName(d: DayItem) {
	return d.kind === "scheduled" ? d.item.template_name : d.item.name;
}

export default function WorkoutCalendar({
	cc,
	wc,
	templates,
	onStarted,
	onGoToTemplates,
}: {
	cc: WorkoutCalendarController;
	wc: WorkoutController;
	templates: WorkoutTemplate[];
	onStarted: () => void;
	onGoToTemplates: () => void;
}) {

	useEffect(() => {
		cc.fetchCalendar();
	}, [cc.fetchCalendar]);

	// group everything by date for the grid
	const byDate = useMemo(() => {

		const map: Record<string, DayItem[]> = {};

		for (const s of cc.calendar?.scheduled ?? []) (map[s.date] ??= []).push({ kind: "scheduled", item: s });
		for (const s of cc.calendar?.sessions ?? []) (map[s.date] ??= []).push({ kind: "session", item: s });

		return map;

	}, [cc.calendar]);

	const monthLabel = new Date(cc.year, cc.month, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
	const monthPrefix = `${cc.year}-${String(cc.month + 1).padStart(2, "0")}`;

	const selectedItems = byDate[cc.selectedDate] ?? [];

	async function handleStart(s: ScheduledWorkout) {
		if (await wc.start(s.template_id, s.id)) onStarted();
	}

	return (
		<div className="space-y-4">
			{(cc.error || wc.error) && <div className={errorBox}>{cc.error ?? wc.error}</div>}

			<section className={`${card} p-3 sm:p-5`}>
				{/* Month nav */}
				<div className="flex items-center justify-between mb-3">
					<button type="button" onClick={cc.prevMonth} aria-label="Previous month" className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
						<ChevronLeft size={18} />
					</button>
					<div className="flex items-center gap-2">
						<h2 className="text-base font-semibold text-slate-900 dark:text-white">{monthLabel}</h2>
						<button type="button" onClick={cc.goToToday} className="rounded-lg px-2 py-0.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
							Today
						</button>
					</div>
					<button type="button" onClick={cc.nextMonth} aria-label="Next month" className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
						<ChevronRight size={18} />
					</button>
				</div>

				{/* Grid */}
				<div className={`grid grid-cols-7 gap-1 transition-opacity ${cc.loading ? "opacity-60" : ""}`}>
					{WEEKDAYS.map((d, i) => (
						<div key={i} className="pb-1 text-center text-[11px] font-medium uppercase text-slate-400">{d}</div>
					))}

					{cc.days.map((date) => {

						const items = byDate[date] ?? [];
						const inMonth = date.startsWith(monthPrefix);
						const isToday = date === cc.today;
						const isSelected = date === cc.selectedDate;

						return (
							<button
								key={date}
								type="button"
								onClick={() => cc.selectDate(date)}
								aria-pressed={isSelected}
								aria-label={`${formatShortDate(date)}${items.length ? `, ${items.length} workout${items.length > 1 ? "s" : ""}` : ""}`}
								className={[
									"min-h-14 sm:min-h-20 rounded-xl p-1 sm:p-1.5 text-left flex flex-col gap-1 transition border",
									isSelected
										? "border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40"
										: "border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/60",
									inMonth ? "" : "opacity-40",
								].join(" ")}
							>
								<span
									className={[
										"grid h-6 w-6 place-items-center rounded-full text-xs tabular-nums",
										isToday ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold" : "text-slate-700 dark:text-slate-300",
									].join(" ")}
								>
									{Number(date.slice(8))}
								</span>

								{/* phones: status dots */}
								{items.length > 0 && (
									<span className="flex flex-wrap gap-1 px-0.5 sm:hidden">
										{items.slice(0, 3).map((d, i) => (
											<span key={i} className={`h-2 w-2 rounded-full ${STATUS[itemStatus(d)].dot}`} />
										))}
									</span>
								)}

								{/* wider screens: named chips */}
								<span className="hidden sm:flex flex-col gap-0.5 min-w-0 w-full">
									{items.slice(0, 2).map((d, i) => (
										<span key={i} className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${STATUS[itemStatus(d)].chip}`}>
											{itemName(d)}
										</span>
									))}
									{items.length > 2 && (
										<span className="px-1 text-[10px] text-slate-500">+{items.length - 2} more</span>
									)}
								</span>
							</button>
						);
					})}
				</div>

				{/* Legend */}
				<div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
					{(["planned", "completed", "in_progress", "missed"] as ScheduledWorkoutStatus[]).map((s) => (
						<span key={s} className="inline-flex items-center gap-1.5">
							<span className={`h-2 w-2 rounded-full ${STATUS[s].dot}`} />
							{STATUS[s].label}
						</span>
					))}
				</div>
			</section>

			<DayPanel
				date={cc.selectedDate}
				today={cc.today}
				items={selectedItems}
				templates={templates}
				cc={cc}
				wc={wc}
				onStart={handleStart}
				onGoToTemplates={onGoToTemplates}
			/>

			{wc.selectedSession && (
				<SessionDetail
					session={wc.selectedSession}
					onClose={wc.closeSession}
					onDelete={async (id) => {
						if (!confirm("Delete this workout permanently?")) return;
						await wc.deleteSession(id);
						await cc.fetchCalendar();
					}}
				/>
			)}
		</div>
	);
}

function DayPanel({
	date,
	today,
	items,
	templates,
	cc,
	wc,
	onStart,
	onGoToTemplates,
}: {
	date: string;
	today: string;
	items: DayItem[];
	templates: WorkoutTemplate[];
	cc: WorkoutCalendarController;
	wc: WorkoutController;
	onStart: (s: ScheduledWorkout) => void;
	onGoToTemplates: () => void;
}) {

	const [templateId, setTemplateId] = useState<string>("");

	// default the picker to the first template once they load
	useEffect(() => {
		if (!templateId && templates[0]) setTemplateId(String(templates[0].id));
	}, [templates, templateId]);

	const canPlan = date >= today;

	async function handlePlan() {
		const id = Number(templateId);
		if (id) await cc.plan(id, date);
	}

	return (
		<section className={`${card} p-4 sm:p-5 space-y-4`}>
			<h3 className="text-sm font-semibold text-slate-900 dark:text-white">
				{date === today ? "Today" : formatShortDate(date)}
			</h3>

			{items.length === 0 ? (
				<p className={muted}>{canPlan ? "Nothing planned." : "No workouts this day."}</p>
			) : (
				<ul className="space-y-2">
					{items.map((d) => {

						const status = itemStatus(d);
						const meta = STATUS[status];
						const Icon = meta.icon;

						return (
							<li
								key={`${d.kind}-${d.item.id}`}
								className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 px-3 py-2.5"
							>
								<div className="min-w-0">
									<p className="text-sm font-medium text-slate-900 dark:text-white truncate">{itemName(d)}</p>
									<p className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
										<Icon size={12} aria-hidden />
										{meta.label}
										{d.kind === "session" && <> · {d.item.set_count} sets</>}
									</p>
								</div>

								<div className="flex shrink-0 items-center gap-1">
									{d.kind === "scheduled" && (status === "planned" || status === "missed") && (
										<button
											type="button"
											onClick={() => onStart(d.item)}
											disabled={!!wc.active || wc.saving}
											title={wc.active ? "Finish your current workout first" : "Start workout"}
											className={`${btnPrimary} inline-flex items-center gap-1.5 px-3 py-1.5`}
										>
											<Play size={14} /> Start
										</button>
									)}

									{(d.kind === "session" || (d.kind === "scheduled" && d.item.status === "completed" && d.item.session_id)) && (
										<button
											type="button"
											onClick={() => wc.openSession(d.kind === "session" ? d.item.id : d.item.session_id!)}
											className="rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
										>
											View
										</button>
									)}

									{d.kind === "scheduled" && d.item.status !== "in_progress" && (
										<button
											type="button"
											onClick={() => cc.unplan(d.item.id)}
											aria-label={`Remove ${d.item.template_name} from calendar`}
											title="Remove from calendar"
											className="rounded-lg p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40"
										>
											<Trash2 size={14} />
										</button>
									)}
								</div>
							</li>
						);
					})}
				</ul>
			)}

			{canPlan && (
				templates.length === 0 ? (
					<p className={muted}>
						<button type="button" onClick={onGoToTemplates} className="text-indigo-600 dark:text-indigo-400 hover:underline">
							Create a template
						</button>{" "}
						to plan workouts on the calendar.
					</p>
				) : (
					<div className="flex gap-2">
						<select
							value={templateId}
							onChange={(e) => setTemplateId(e.target.value)}
							aria-label="Template to plan"
							className={`${input} text-sm flex-1 min-w-0`}
						>
							{templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
						</select>
						<button type="button" onClick={handlePlan} disabled={!templateId || cc.saving} className={`${btnPrimary} shrink-0`}>
							{cc.saving ? "Adding…" : "Plan"}
						</button>
					</div>
				)
			)}
		</section>
	);
}