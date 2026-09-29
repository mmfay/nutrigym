"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Equipment, Exercise, MuscleGroup, TrackingType } from "@/lib/dataTypes";
import { EQUIPMENT, MUSCLE_GROUPS, TRACKING_TYPES } from "@/lib/dataTypes/dropdownData";
import { ExerciseController } from "@/lib/hooks/useExerciseController";
import { labelize, TRACKING_TYPE_LABELS } from "@/lib/utils/workout";
import VerifiedBadge from "../VerifiedBadge";
import { btnPrimary, btnSecondary, errorBox, input } from "./ui";

type Props = {
	isOpen: boolean;
	onClose: () => void;
	onSelect: (exercise: Exercise) => void;
	ec: ExerciseController;
	title?: string;
	// ids already in the workout/template, shown as added
	selectedIds?: number[];
};

export default function ExercisePicker({ isOpen, onClose, onSelect, ec, title = "Add exercise", selectedIds = [] }: Props) {

	const [query, setQuery] = useState("");
	const [muscle, setMuscle] = useState<MuscleGroup | "">("");
	const [results, setResults] = useState<Exercise[]>([]);
	const [loading, setLoading] = useState(false);
	const [creating, setCreating] = useState(false);
	const requestSeq = useRef(0);
	const inputRef = useRef<HTMLInputElement>(null);

	// reset when opened
	useEffect(() => {

		if (!isOpen) return;

		setQuery("");
		setMuscle("");
		setCreating(false);
		ec.clearError();
		setTimeout(() => inputRef.current?.focus(), 0);

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};

		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);

	}, [isOpen]);

	// debounced search; an empty query lists the catalog (optionally filtered by muscle)
	useEffect(() => {

		if (!isOpen) return;

		const mySeq = ++requestSeq.current;
		setLoading(true);

		const t = setTimeout(() => {
			ec.onSearch(query.trim(), muscle || undefined)
				.then((data) => {
					if (requestSeq.current === mySeq) setResults(data);
				})
				.finally(() => {
					if (requestSeq.current === mySeq) setLoading(false);
				});
		}, 250);

		return () => clearTimeout(t);

	}, [query, muscle, isOpen]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50"
			aria-modal="true"
			role="dialog"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" />

			<div
				className="absolute inset-0 grid place-items-end sm:place-items-center p-safe-4"
				onClick={(e) => {
					if (e.target === e.currentTarget) onClose();
				}}
			>
				<div className="w-full min-w-0 max-w-lg max-h-[85dvh] flex flex-col rounded-2xl border border-slate-700/60 bg-slate-900/95 text-slate-100 shadow-2xl ring-1 ring-white/10">

					{/* Header */}
					<div className="flex items-center justify-between px-5 pt-5 pb-3">
						<h3 className="text-base font-semibold">{creating ? "New custom exercise" : title}</h3>
						<button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800">
							<X size={18} />
						</button>
					</div>

					{creating ? (
						<CreateExerciseForm
							ec={ec}
							initialName={query.trim()}
							initialMuscle={muscle || "chest"}
							onCancel={() => setCreating(false)}
							onCreated={(ex) => {
								onSelect(ex);
								setCreating(false);
							}}
						/>
					) : (
						<>
							{/* Search + filter */}
							<div className="px-5 space-y-3">
								<input
									ref={inputRef}
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder="Search exercises…"
									className={input}
								/>
								<div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
									<Chip active={muscle === ""} onClick={() => setMuscle("")}>All</Chip>
									{MUSCLE_GROUPS.map((m) => (
										<Chip key={m} active={muscle === m} onClick={() => setMuscle(m)}>
											{labelize(m)}
										</Chip>
									))}
								</div>
							</div>

							{/* Results */}
							<div className="flex-1 overflow-y-auto px-3 py-2 min-h-[200px]">
								{loading && results.length === 0 ? (
									<p className="px-2 py-6 text-center text-sm text-slate-400">Searching…</p>
								) : results.length === 0 ? (
									<p className="px-2 py-6 text-center text-sm text-slate-400">No exercises found.</p>
								) : (
									<ul className="space-y-1">
										{results.map((ex) => {
											const added = selectedIds.includes(ex.id);
											return (
												<li key={ex.id}>
													<button
														type="button"
														onClick={() => onSelect(ex)}
														className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-800 transition"
													>
														<div className="min-w-0">
															<div className="flex items-center gap-1.5 text-sm font-medium truncate">
																{ex.name}
																{ex.is_verified && <VerifiedBadge />}
																{ex.is_custom && (
																	<span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">Custom</span>
																)}
															</div>
															<div className="text-xs text-slate-400">
																{labelize(ex.muscle_group)} · {labelize(ex.equipment)}
															</div>
														</div>
														<span className={`shrink-0 text-xs ${added ? "text-emerald-400" : "text-indigo-400"}`}>
															{added ? "Added" : "Add"}
														</span>
													</button>
												</li>
											);
										})}
									</ul>
								)}
							</div>

							{/* Footer */}
							<div className="border-t border-slate-800 px-5 py-3">
								<button
									type="button"
									onClick={() => setCreating(true)}
									className="inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300"
								>
									<Plus size={16} /> Can&apos;t find it? Create a custom exercise
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={[
				"shrink-0 rounded-full px-3 py-1 text-xs border transition",
				active
					? "bg-indigo-500 border-indigo-400 text-white"
					: "border-slate-700 text-slate-300 hover:bg-slate-800",
			].join(" ")}
		>
			{children}
		</button>
	);
}

function CreateExerciseForm({
	ec,
	initialName,
	initialMuscle,
	onCancel,
	onCreated,
}: {
	ec: ExerciseController;
	initialName: string;
	initialMuscle: MuscleGroup;
	onCancel: () => void;
	onCreated: (exercise: Exercise) => void;
}) {

	const [name, setName] = useState(initialName);
	const [muscle, setMuscle] = useState<MuscleGroup>(initialMuscle);
	const [equipment, setEquipment] = useState<Equipment>("barbell");
	const [tracking, setTracking] = useState<TrackingType>("WEIGHT_REPS");

	async function handleCreate() {
		const created = await ec.onCreate({ name: name.trim(), muscle_group: muscle, equipment, tracking_type: tracking });
		if (created) onCreated(created);
	}

	const select = `${input} text-sm`;

	return (
		<div className="px-5 pb-5 space-y-4 overflow-y-auto">
			<label className="block text-sm">
				<span className="text-slate-300">Name</span>
				<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pendlay Row" className={`${input} mt-1`} />
			</label>

			<div className="grid grid-cols-2 gap-3">
				<label className="block text-sm">
					<span className="text-slate-300">Muscle group</span>
					<select value={muscle} onChange={(e) => setMuscle(e.target.value as MuscleGroup)} className={`${select} mt-1`}>
						{MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{labelize(m)}</option>)}
					</select>
				</label>
				<label className="block text-sm">
					<span className="text-slate-300">Equipment</span>
					<select value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)} className={`${select} mt-1`}>
						{EQUIPMENT.map((m) => <option key={m} value={m}>{labelize(m)}</option>)}
					</select>
				</label>
			</div>

			<label className="block text-sm">
				<span className="text-slate-300">What do you track?</span>
				<select value={tracking} onChange={(e) => setTracking(e.target.value as TrackingType)} className={`${select} mt-1`}>
					{TRACKING_TYPES.map((t) => <option key={t} value={t}>{TRACKING_TYPE_LABELS[t]}</option>)}
				</select>
			</label>

			{ec.error && <div className={errorBox}>{ec.error}</div>}

			<div className="flex justify-end gap-2 pt-1">
				<button type="button" onClick={onCancel} className={btnSecondary}>Back</button>
				<button type="button" onClick={handleCreate} disabled={!name.trim() || ec.creating} className={btnPrimary}>
					{ec.creating ? "Creating…" : "Create & add"}
				</button>
			</div>
		</div>
	);
}