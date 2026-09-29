"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { ExerciseLastPerformance, WorkoutSessionExercise, WorkoutSet } from "@/lib/dataTypes";
import { WorkoutController } from "@/lib/hooks/useWorkoutController";
import {
	draftFromSet,
	draftFromTargets,
	EMPTY_SET_DRAFT,
	formatSet,
	formatTargets,
	labelize,
	SetDraft,
	setInputFromDraft,
} from "@/lib/utils/workout";
import SetInputs from "./SetInputs";
import { btnDanger, btnPrimary, btnSecondary, card, errorBox, input } from "./ui";

export default function ActiveWorkout({ wc }: { wc: WorkoutController }) {

	const session = wc.active!;

	const [name, setName] = useState(session.name);
	const [notes, setNotes] = useState(session.notes ?? "");

	useEffect(() => setName(session.name), [session.name]);
	useEffect(() => setNotes(session.notes ?? ""), [session.notes]);

	const allSets = session.exercises.flatMap((e) => e.sets);
	const workingSets = allSets.filter((s) => !s.is_warmup);
	const volume = workingSets.reduce((acc, s) => acc + Number(s.weight ?? 0) * Number(s.reps ?? 0), 0);

	async function handleFinish() {
		const msg = allSets.length === 0
			? "You haven't logged any sets. Finish anyway?"
			: "Finish this workout?";
		if (!confirm(msg)) return;
		await wc.finish();
	}

	async function handleDiscard() {
		if (!confirm("Discard this workout? Logged sets will be deleted.")) return;
		await wc.discard();
	}

	return (
		<div className="space-y-4 pb-24">

			{/* Header */}
			<div className={`${card} p-4 sm:p-5 space-y-3`}>
				<input
					value={name}
					onChange={(e) => setName(e.target.value)}
					onBlur={() => name.trim() && name.trim() !== session.name && wc.rename(name)}
					onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
					aria-label="Workout name"
					className="w-full bg-transparent text-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-1 -mx-1"
				/>

				<div className="grid grid-cols-2 gap-2 text-center">
					<Stat label="Sets" value={String(workingSets.length)} />
					<Stat label="Volume" value={`${Math.round(volume).toLocaleString()} lb`} />
				</div>
			</div>

			{wc.error && (
				<div className={`${errorBox} flex items-start justify-between gap-3`}>
					<span>{wc.error}</span>
					<button onClick={wc.clearError} aria-label="Dismiss"><X size={16} /></button>
				</div>
			)}

			{/* Exercises */}
			{session.exercises.length === 0 && (
				<div className={`${card} px-6 py-10 text-center`}>
					<p className="text-sm text-slate-600 dark:text-slate-300">Add your first exercise to start logging sets.</p>
				</div>
			)}

			{session.exercises.map((ex) => (
				<ExerciseCard key={ex.id} ex={ex} last={wc.lastPerformance[ex.exercise_id]} wc={wc} />
			))}

			<button
				type="button"
				onClick={wc.openExercisePicker}
				className="w-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 py-4 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-white/50 dark:hover:bg-slate-900/50 transition inline-flex items-center justify-center gap-2"
			>
				<Plus size={18} /> Add exercise
			</button>

			{/* Notes */}
			<label className="block">
				<span className="text-sm text-slate-600 dark:text-slate-300">Notes</span>
				<textarea
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					onBlur={() => notes.trim() !== (session.notes ?? "") && wc.saveNotes(notes)}
					rows={2}
					placeholder="How did it feel?"
					className={`${input} mt-1`}
				/>
			</label>

			{/* Actions, pinned to the bottom on mobile */}
			<div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur pb-[env(safe-area-inset-bottom)]">
				<div className="mx-auto max-w-3xl px-4 py-3 flex gap-2">
					<button type="button" onClick={handleDiscard} disabled={wc.saving} className={`${btnDanger} flex-1`}>
						Discard
					</button>
					<button type="button" onClick={handleFinish} disabled={wc.saving} className={`${btnPrimary} flex-[2]`}>
						Finish workout
					</button>
				</div>
			</div>
		</div>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl bg-slate-100/80 dark:bg-slate-800/60 px-2 py-2">
			<div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
			<div className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">{value}</div>
		</div>
	);
}

/**
 * Suggested values for the next set: repeat this workout's previous set, else the
 * matching set from last time, else the template targets.
 */
function suggestDraft(ex: WorkoutSessionExercise, last: ExerciseLastPerformance | null | undefined): SetDraft {

	const prev = ex.sets[ex.sets.length - 1];
	if (prev) return draftFromSet(prev);

	const lastWorking = last?.sets.filter((s) => !s.is_warmup) ?? [];
	if (lastWorking.length) return draftFromSet(lastWorking[0]);

	if (ex.target_reps !== null || ex.target_weight !== null || ex.target_duration_seconds !== null) {
		return draftFromTargets(ex);
	}

	return EMPTY_SET_DRAFT;

}

function ExerciseCard({
	ex,
	last,
	wc,
}: {
	ex: WorkoutSessionExercise;
	last: ExerciseLastPerformance | null | undefined;
	wc: WorkoutController;
}) {

	const suggestion = useMemo(() => suggestDraft(ex, last), [ex, last]);

	const [draft, setDraft] = useState<SetDraft>(suggestion);
	const [warmup, setWarmup] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);

	// refill the inputs after each logged set, and once "last time" loads
	useEffect(() => {
		setDraft(suggestion);
	}, [ex.sets.length, last]);

	const payload = setInputFromDraft(draft, ex.tracking_type, warmup);
	const workingCount = ex.sets.filter((s) => !s.is_warmup).length;
	const targets = formatTargets(ex, ex.tracking_type);

	async function handleLog() {
		if (!payload) return;
		const ok = await wc.logSet(ex.id, payload);
		if (ok) setWarmup(false);
	}

	async function handleRemoveExercise() {
		if (ex.sets.length > 0 && !confirm(`Remove ${ex.exercise_name} and its ${ex.sets.length} logged set(s)?`)) return;
		await wc.removeExercise(ex.id);
	}

	const lastSummary = last?.sets.filter((s) => !s.is_warmup).map((s) => formatSet(s, ex.tracking_type)).join(", ");

	return (
		<div className={`${card} overflow-hidden`}>

			{/* Header */}
			<div className="flex items-start justify-between gap-3 px-4 pt-4">
				<div className="min-w-0">
					<h3 className="font-semibold text-slate-900 dark:text-white truncate">{ex.exercise_name}</h3>
					<p className="text-xs text-slate-500 dark:text-slate-400">
						{labelize(ex.muscle_group)}
						{targets && <> · Target {targets}</>}
						{ex.target_sets ? <> · {workingCount}/{ex.target_sets} done</> : null}
					</p>
					{lastSummary && (
						<p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">Last time: {lastSummary}</p>
					)}
				</div>
				<button
					type="button"
					onClick={handleRemoveExercise}
					aria-label={`Remove ${ex.exercise_name}`}
					className="shrink-0 rounded-lg p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition"
				>
					<Trash2 size={16} />
				</button>
			</div>

			{/* Logged sets */}
			{ex.sets.length > 0 && (
				<ul className="mt-3 divide-y divide-slate-200/60 dark:divide-slate-700/60 border-y border-slate-200/60 dark:border-slate-700/60">
					{ex.sets.map((s) =>
						editingId === s.id ? (
							<EditSetRow
								key={s.id}
								set={s}
								ex={ex}
								wc={wc}
								onDone={() => setEditingId(null)}
							/>
						) : (
							<li key={s.id} className="flex items-center justify-between px-4 py-2.5">
								<div className="flex items-center gap-3">
									<span className="w-6 text-center text-xs font-semibold text-slate-400">
										{s.is_warmup ? "W" : s.set_number}
									</span>
									<span className={`text-sm tabular-nums ${s.is_warmup ? "text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-white font-medium"}`}>
										{formatSet(s, ex.tracking_type)}
									</span>
								</div>
								<div className="flex items-center gap-1">
									<Check size={16} className="text-emerald-500 mr-1" aria-hidden />
									<button
										type="button"
										onClick={() => setEditingId(s.id)}
										aria-label="Edit set"
										className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
									>
										<Pencil size={14} />
									</button>
								</div>
							</li>
						)
					)}
				</ul>
			)}

			{/* Next set */}
			<div className="px-4 py-4 space-y-3">
				<SetInputs tracking={ex.tracking_type} draft={draft} onChange={setDraft} />
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setWarmup((w) => !w)}
						aria-pressed={warmup}
						className={[
							"h-12 rounded-xl px-3 text-xs font-medium border transition",
							warmup
								? "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-300"
								: "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400",
						].join(" ")}
					>
						Warm-up
					</button>
					<button
						type="button"
						onClick={handleLog}
						disabled={!payload}
						className={`${btnPrimary} h-12 flex-1 text-base`}
					>
						Log set {ex.sets.length + 1}
					</button>
				</div>
			</div>
		</div>
	);
}

function EditSetRow({
	set,
	ex,
	wc,
	onDone,
}: {
	set: WorkoutSet;
	ex: WorkoutSessionExercise;
	wc: WorkoutController;
	onDone: () => void;
}) {

	const [draft, setDraft] = useState<SetDraft>(draftFromSet(set));
	const [warmup, setWarmup] = useState(set.is_warmup);

	const payload = setInputFromDraft(draft, ex.tracking_type, warmup);

	async function handleSave() {
		if (!payload) return;
		if (await wc.editSet(set.id, payload)) onDone();
	}

	async function handleDelete() {
		await wc.removeSet(set.id);
		onDone();
	}

	return (
		<li className="px-4 py-3 space-y-2 bg-slate-50/80 dark:bg-slate-800/40">
			<SetInputs tracking={ex.tracking_type} draft={draft} onChange={setDraft} />
			<label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
				<input type="checkbox" checked={warmup} onChange={(e) => setWarmup(e.target.checked)} />
				Warm-up set
			</label>
			<div className="flex gap-2">
				<button type="button" onClick={handleDelete} className={`${btnDanger} px-3`} aria-label="Delete set">
					<Trash2 size={16} />
				</button>
				<button type="button" onClick={onDone} className={`${btnSecondary} flex-1`}>Cancel</button>
				<button type="button" onClick={handleSave} disabled={!payload} className={`${btnPrimary} flex-1`}>Save</button>
			</div>
		</li>
	);
}