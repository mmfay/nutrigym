"use client";

import { TrackingType } from "@/lib/dataTypes";
import { SetDraft } from "@/lib/utils/workout";

const field =
	"h-12 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 " +
	"px-2 text-center text-base font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 " +
	"focus:outline-none focus:ring-2 focus:ring-indigo-500";

function Field({
	label,
	value,
	onChange,
	placeholder,
	inputMode,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	inputMode: "decimal" | "numeric" | "text";
}) {
	return (
		<label className="block min-w-0 flex-1">
			<span className="block text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-center mb-1">{label}</span>
			<input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				inputMode={inputMode}
				placeholder={placeholder}
				className={field}
				onFocus={(e) => e.currentTarget.select()}
			/>
		</label>
	);
}

/**
 * The inputs for one set, chosen by the exercise's tracking type.
 */
export default function SetInputs({
	tracking,
	draft,
	onChange,
}: {
	tracking: TrackingType;
	draft: SetDraft;
	onChange: (draft: SetDraft) => void;
}) {

	const set = (k: keyof SetDraft) => (v: string) => onChange({ ...draft, [k]: v });

	switch (tracking) {
		case "WEIGHT_REPS":
			return (
				<div className="flex gap-2">
					<Field label="lb" value={draft.weight} onChange={set("weight")} inputMode="decimal" placeholder="0" />
					<Field label="Reps" value={draft.reps} onChange={set("reps")} inputMode="numeric" placeholder="0" />
				</div>
			);
		case "REPS":
			return (
				<div className="flex gap-2">
					<Field label="Reps" value={draft.reps} onChange={set("reps")} inputMode="numeric" placeholder="0" />
					<Field label="+ lb (optional)" value={draft.weight} onChange={set("weight")} inputMode="decimal" placeholder="—" />
				</div>
			);
		case "TIME":
			return (
				<div className="flex gap-2">
					<Field label="Time (m:ss)" value={draft.duration} onChange={set("duration")} inputMode="text" placeholder="0:45" />
				</div>
			);
		case "DISTANCE_TIME":
			return (
				<div className="flex gap-2">
					<Field label="Miles" value={draft.distance} onChange={set("distance")} inputMode="decimal" placeholder="0" />
					<Field label="Time (m:ss)" value={draft.duration} onChange={set("duration")} inputMode="text" placeholder="25:00" />
				</div>
			);
	}

}