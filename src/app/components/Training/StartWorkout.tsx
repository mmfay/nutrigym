"use client";

import { Dumbbell, Play } from "lucide-react";
import { WorkoutTemplate } from "@/lib/dataTypes";
import { WorkoutController } from "@/lib/hooks/useWorkoutController";
import { formatTargets } from "@/lib/utils/workout";
import { btnPrimary, card, errorBox, muted } from "./ui";

export default function StartWorkout({
	wc,
	templates,
	loadingTemplates,
	onGoToTemplates,
}: {
	wc: WorkoutController;
	templates: WorkoutTemplate[];
	loadingTemplates: boolean;
	onGoToTemplates: () => void;
}) {
	return (
		<div className="space-y-6">
			{wc.error && <div className={errorBox}>{wc.error}</div>}

			<div className={`${card} px-6 py-8 text-center`}>
				<div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-500">
					<Dumbbell size={24} />
				</div>
				<h2 className="text-base font-semibold text-slate-900 dark:text-white">Ready to train?</h2>
				<p className="mt-1 mb-5 text-sm text-slate-600 dark:text-slate-300">
					Start an empty workout and add exercises as you go, or pick a template below.
				</p>
				<button type="button" onClick={() => wc.start()} disabled={wc.saving} className={`${btnPrimary} px-6 py-3 text-base`}>
					{wc.saving ? "Starting…" : "Start empty workout"}
				</button>
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-semibold text-slate-900 dark:text-white">Start from a template</h2>
					<button type="button" onClick={onGoToTemplates} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
						Manage templates
					</button>
				</div>

				{loadingTemplates ? (
					<p className={muted}>Loading…</p>
				) : templates.length === 0 ? (
					<div className={`${card} px-6 py-6 text-center`}>
						<p className={muted}>No templates yet. Build one to start workouts in a single tap.</p>
					</div>
				) : (
					<ul className="grid gap-3 sm:grid-cols-2">
						{templates.map((t) => (
							<li key={t.id}>
								<button
									type="button"
									onClick={() => wc.start(t.id)}
									disabled={wc.saving}
									className={`${card} w-full p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60`}
								>
									<div className="flex items-center justify-between gap-2">
										<span className="font-semibold text-slate-900 dark:text-white truncate">{t.name}</span>
										<Play size={16} className="shrink-0 text-indigo-500" />
									</div>
									<ul className="mt-2 space-y-0.5">
										{t.exercises.slice(0, 5).map((e) => (
											<li key={e.id} className="flex justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
												<span className="truncate">{e.exercise_name}</span>
												<span className="shrink-0 text-slate-400">{formatTargets(e, e.tracking_type)}</span>
											</li>
										))}
										{t.exercises.length > 5 && (
											<li className="text-xs text-slate-400">+{t.exercises.length - 5} more</li>
										)}
									</ul>
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}