"use client";

import { useEffect, useState } from "react";
import { Exercise } from "@/lib/dataTypes";
import { useExerciseController } from "@/lib/hooks/useExerciseController";
import { useWorkoutCalendarController } from "@/lib/hooks/useWorkoutCalendarController";
import { useWorkoutController } from "@/lib/hooks/useWorkoutController";
import { useWorkoutTemplateController } from "@/lib/hooks/useWorkoutTemplateController";
import ActiveWorkout from "@/app/components/Training/ActiveWorkout";
import ExercisePicker from "@/app/components/Training/ExercisePicker";
import StartWorkout from "@/app/components/Training/StartWorkout";
import Templates from "@/app/components/Training/Templates";
import WorkoutCalendar from "@/app/components/Training/WorkoutCalendar";
import WorkoutHistory from "@/app/components/Training/WorkoutHistory";

type Tab = "workout" | "calendar" | "templates" | "history";

const TABS: { key: Tab; label: string }[] = [
	{ key: "workout", label: "Workout" },
	{ key: "calendar", label: "Calendar" },
	{ key: "templates", label: "Templates" },
	{ key: "history", label: "History" },
];

export default function TrainingPage() {

	const wc = useWorkoutController();
	const tc = useWorkoutTemplateController();
	const ec = useExerciseController();
	const cc = useWorkoutCalendarController();

	const [tab, setTab] = useState<Tab>("workout");
	const [progressPickerOpen, setProgressPickerOpen] = useState(false);

	useEffect(() => {
		wc.fetchActive();
		tc.fetchTemplates();
	}, []);

	// history is loaded on first visit to the tab, and again after each finished workout
	useEffect(() => {
		if (tab === "history") wc.fetchHistory();
	}, [tab]);

	async function handleStart(template_id?: number | null) {
		if (await wc.start(template_id)) setTab("workout");
	}

	// one picker serves the active workout, the template builder and the progress chart
	const pickerOpen = wc.exercisePickerOpen || tc.exercisePickerOpen || progressPickerOpen;

	function closePicker() {
		wc.closeExercisePicker();
		tc.closeExercisePicker();
		setProgressPickerOpen(false);
	}

	function handlePick(exercise: Exercise) {

		if (wc.exercisePickerOpen) {
			wc.addExercise(exercise.id);
			closePicker();
		} else if (tc.exercisePickerOpen) {
			// stays open so several exercises can be added in a row
			tc.addPending(exercise);
		} else {
			wc.loadProgress(exercise);
			closePicker();
		}

	}

	const selectedIds = wc.exercisePickerOpen
		? wc.active?.exercises.map((e) => e.exercise_id) ?? []
		: tc.exercisePickerOpen
			? tc.pending.map((p) => p.exercise.id)
			: [];

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
			<main className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Training</h1>
						<p className="text-sm text-slate-600 dark:text-slate-300">
							{wc.active ? "Workout in progress." : "Log workouts, build templates, track progress."}
						</p>
					</div>

					<div role="tablist" className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 p-0.5">
						{TABS.map((t) => (
							<button
								key={t.key}
								role="tab"
								type="button"
								aria-selected={tab === t.key}
								onClick={() => setTab(t.key)}
								className={[
									"relative rounded-lg px-2.5 sm:px-3 py-1.5 text-sm font-medium transition",
									tab === t.key
										? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
										: "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
								].join(" ")}
							>
								{t.label}
								{t.key === "workout" && wc.active && tab !== "workout" && (
									<span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500" aria-label="In progress" />
								)}
							</button>
						))}
					</div>
				</div>

				{tab === "workout" && (
					wc.loadingActive ? (
						<p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</p>
					) : wc.active ? (
						<ActiveWorkout wc={wc} />
					) : (
						<StartWorkout
							wc={wc}
							templates={tc.templates}
							loadingTemplates={tc.loading}
							onGoToTemplates={() => setTab("templates")}
						/>
					)
				)}

				{tab === "calendar" && (
					<WorkoutCalendar
						cc={cc}
						wc={wc}
						templates={tc.templates}
						onStarted={() => setTab("workout")}
						onGoToTemplates={() => setTab("templates")}
					/>
				)}

				{tab === "templates" && (
					<Templates tc={tc} onStart={handleStart} startDisabled={!!wc.active || wc.saving} />
				)}

				{tab === "history" && (
					<WorkoutHistory wc={wc} onPickProgressExercise={() => setProgressPickerOpen(true)} />
				)}
			</main>

			<ExercisePicker
				isOpen={pickerOpen}
				onClose={closePicker}
				onSelect={handlePick}
				ec={ec}
				selectedIds={selectedIds}
				title={progressPickerOpen ? "Show progress for…" : tc.exercisePickerOpen ? "Add to template" : "Add exercise"}
			/>
		</div>
	);
}