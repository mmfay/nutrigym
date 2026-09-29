"use client";

import { ArrowDown, ArrowUp, Pencil, Play, Plus, Trash2, X } from "lucide-react";
import { WorkoutTemplateController } from "@/lib/hooks/useWorkoutTemplateController";
import { formatTargets, labelize } from "@/lib/utils/workout";
import { btnPrimary, btnSecondary, card, errorBox, input, muted } from "./ui";

const small =
	"h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 " +
	"px-2 text-center text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 " +
	"focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function Templates({
	tc,
	onStart,
	startDisabled,
}: {
	tc: WorkoutTemplateController;
	onStart: (template_id: number) => void;
	startDisabled: boolean;
}) {

	return (
		<div className="space-y-8">
			<TemplateBuilder tc={tc} />

			<section className="space-y-3">
				<h2 className="text-sm font-semibold text-slate-900 dark:text-white">
					Saved templates ({tc.templates.length})
				</h2>

				{tc.loading ? (
					<p className={muted}>Loading…</p>
				) : tc.templates.length === 0 ? (
					<p className={muted}>Nothing saved yet.</p>
				) : (
					<ul className="space-y-3">
						{tc.templates.map((t) => (
							<li key={t.id} className={`${card} overflow-hidden`}>
								<div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200/60 dark:border-slate-700/60">
									<div className="min-w-0">
										<p className="font-semibold text-slate-900 dark:text-white truncate">{t.name}</p>
										{t.notes && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t.notes}</p>}
									</div>
									<div className="flex shrink-0 items-center gap-1">
										<IconButton label="Start workout" onClick={() => onStart(t.id)} disabled={startDisabled}>
											<Play size={16} />
										</IconButton>
										<IconButton label="Edit template" onClick={() => { tc.editTemplate(t); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
											<Pencil size={16} />
										</IconButton>
										<IconButton
											label="Delete template"
											danger
											onClick={() => confirm(`Delete "${t.name}"? Past workouts are kept.`) && tc.removeTemplate(t.id)}
										>
											<Trash2 size={16} />
										</IconButton>
									</div>
								</div>
								<ul className="px-4 py-3 space-y-1">
									{t.exercises.map((e) => (
										<li key={e.id} className="flex justify-between gap-2 text-sm">
											<span className="truncate text-slate-800 dark:text-slate-200">{e.exercise_name}</span>
											<span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{formatTargets(e, e.tracking_type)}</span>
										</li>
									))}
								</ul>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}

function IconButton({
	label,
	onClick,
	children,
	danger,
	disabled,
}: {
	label: string;
	onClick: () => void;
	children: React.ReactNode;
	danger?: boolean;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			onClick={onClick}
			disabled={disabled}
			className={[
				"rounded-lg p-2 transition disabled:opacity-40",
				danger
					? "text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/40"
					: "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40",
			].join(" ")}
		>
			{children}
		</button>
	);
}

function TemplateBuilder({ tc }: { tc: WorkoutTemplateController }) {

	return (
		<section className={`${card} p-4 sm:p-5 space-y-4`}>
			<div className="flex items-center justify-between">
				<h2 className="text-base font-semibold text-slate-900 dark:text-white">
					{tc.editingId ? "Edit template" : "New template"}
				</h2>
				{(tc.editingId || tc.pending.length > 0 || tc.name) && (
					<button type="button" onClick={tc.resetBuilder} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
						{tc.editingId ? "Cancel edit" : "Clear"}
					</button>
				)}
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				<label className="block text-sm">
					<span className="text-slate-600 dark:text-slate-300">Name</span>
					<input value={tc.name} onChange={(e) => tc.setName(e.target.value)} placeholder="e.g. Push Day A" className={`${input} mt-1`} />
				</label>
				<label className="block text-sm">
					<span className="text-slate-600 dark:text-slate-300">Notes (optional)</span>
					<input value={tc.notes} onChange={(e) => tc.setNotes(e.target.value)} placeholder="e.g. Heavy week" className={`${input} mt-1`} />
				</label>
			</div>

			{tc.pending.length === 0 ? (
				<p className={`${muted} py-2`}>Add exercises and set targets for each one.</p>
			) : (
				<ul className="space-y-2">
					{tc.pending.map((p, i) => {
						const timed = p.exercise.tracking_type === "TIME" || p.exercise.tracking_type === "DISTANCE_TIME";
						return (
							<li key={p.tempId} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 p-3 space-y-2">
								<div className="flex items-center justify-between gap-2">
									<div className="min-w-0">
										<p className="text-sm font-medium text-slate-900 dark:text-white truncate">
											{i + 1}. {p.exercise.name}
										</p>
										<p className="text-xs text-slate-500 dark:text-slate-400">{labelize(p.exercise.muscle_group)}</p>
									</div>
									<div className="flex shrink-0 items-center">
										<IconButton label="Move up" onClick={() => tc.movePending(p.tempId, -1)} disabled={i === 0}>
											<ArrowUp size={14} />
										</IconButton>
										<IconButton label="Move down" onClick={() => tc.movePending(p.tempId, 1)} disabled={i === tc.pending.length - 1}>
											<ArrowDown size={14} />
										</IconButton>
										<IconButton label="Remove" danger onClick={() => tc.removePending(p.tempId)}>
											<X size={14} />
										</IconButton>
									</div>
								</div>
								<div className="grid grid-cols-3 gap-2">
									<TargetField label="Sets" value={p.target_sets} onChange={(v) => tc.updatePending(p.tempId, { target_sets: v })} inputMode="numeric" />
									{timed ? (
										<TargetField label="Time (m:ss)" value={p.target_duration_seconds} onChange={(v) => tc.updatePending(p.tempId, { target_duration_seconds: v })} inputMode="text" placeholder="—" />
									) : (
										<>
											<TargetField label="Reps" value={p.target_reps} onChange={(v) => tc.updatePending(p.tempId, { target_reps: v })} inputMode="numeric" placeholder="—" />
											<TargetField label="lb" value={p.target_weight} onChange={(v) => tc.updatePending(p.tempId, { target_weight: v })} inputMode="decimal" placeholder="—" />
										</>
									)}
								</div>
							</li>
						);
					})}
				</ul>
			)}

			<button
				type="button"
				onClick={tc.openExercisePicker}
				className="w-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-white/50 dark:hover:bg-slate-900/50 transition inline-flex items-center justify-center gap-2"
			>
				<Plus size={16} /> Add exercise
			</button>

			{tc.error && <div className={errorBox}>{tc.error}</div>}

			<div className="flex justify-end gap-2">
				{tc.editingId && (
					<button type="button" onClick={tc.resetBuilder} className={btnSecondary}>Cancel</button>
				)}
				<button
					type="button"
					onClick={tc.saveTemplate}
					disabled={tc.saving || !tc.name.trim() || tc.pending.length === 0}
					className={btnPrimary}
				>
					{tc.saving ? "Saving…" : tc.editingId ? "Update template" : "Save template"}
				</button>
			</div>
		</section>
	);
}

function TargetField({
	label,
	value,
	onChange,
	inputMode,
	placeholder,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	inputMode: "numeric" | "decimal" | "text";
	placeholder?: string;
}) {
	return (
		<label className="block">
			<span className="block text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-center mb-1">{label}</span>
			<input value={value} onChange={(e) => onChange(e.target.value)} inputMode={inputMode} placeholder={placeholder} className={small} />
		</label>
	);
}