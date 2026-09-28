"use client";

import { useEffect, useState } from "react";
import { FoodTracked } from "@/lib/dataTypes";
import { Meal } from "@/lib/utils/meal";
import { MEALS, mealColors } from "@/lib/ui/mealColors";

type EditLoggedFoodProps = {
	item: FoodTracked | null;
	onClose: () => void;
	onSave: (id: number, meal: number, servingSize: number) => Promise<void>;
};

function toNum(x: unknown, fallback = 0) {
	const n = typeof x === "number" ? x : Number(x);
	return Number.isFinite(n) ? n : fallback;
}

// rounding helpers
function round1(n: number) {
	return Math.round(n * 10) / 10;
}

function round0(n: number) {
	return Math.round(n);
}

export default function EditLoggedFood({ item, onClose, onSave }: EditLoggedFoodProps) {

	const [meal, setMeal] = useState<Meal>("breakfast");
	const [qty, setQty] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Shared UI primitives (match AddFoodToLog modal)
	const inputBase =
		"w-full rounded-lg border px-3 py-2 text-base " +
		"bg-white dark:bg-slate-900/60 " +
		"text-slate-900 dark:text-slate-100 placeholder:text-slate-400 " +
		"border-slate-300 dark:border-slate-700 " +
		"focus:outline-none focus:ring-2 focus:ring-indigo-500";

	const labelBase = "block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1";

	// When modal opens with a new item, reset the form to its current values
	useEffect(() => {
		if (!item) return;
		setMeal(MEALS[item.meal] ?? "breakfast");
		setQty(String(toNum(item.serving_size)));
		setSaving(false);
		setError(null);
	}, [item]);

	if (!item) return null;

	const originalQty = toNum(item.serving_size);
	const nextQty = toNum(qty, 0);
	const canScale = originalQty > 0;
	const qtyValid = canScale && qty.trim() !== "" && nextQty > 0;

	// preview macros scaled from the logged values (mirrors the server calculation)
	const ratio = canScale ? nextQty / originalQty : 1;
	const preview = {
		calories: round0(toNum(item.calories) * ratio),
		protein:  round1(toNum(item.protein) * ratio),
		carbs:    round1(toNum(item.carbs) * ratio),
		fat:      round1(toNum(item.fat) * ratio),
	};

	async function handleSubmit(e: React.FormEvent) {

		e.preventDefault();

		if (!item || !qtyValid) return;

		setSaving(true);
		setError(null);

		try {
			await onSave(item.id, MEALS.indexOf(meal), nextQty);
			onClose();
		} catch (err) {
			setError(err instanceof Error && err.message ? err.message : "Unable to update logged food.");
			setSaving(false);
		}

	}

	return (
		<div
		className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-safe-4"
		role="dialog"
		aria-modal="true"
		onMouseDown={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
		>
		<div className="w-full max-w-lg rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/90 shadow-xl overflow-hidden">
			{/* Header */}
			<div className="px-6 pt-5 pb-4 border-b border-slate-200/60 dark:border-slate-700/60">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
				<h4 className="text-base font-semibold text-slate-900 dark:text-white">Edit Logged Food</h4>
				<p className="mt-1 text-sm text-slate-600 dark:text-slate-300 truncate">{item.name}</p>

				<div className="mt-3 flex flex-wrap items-center gap-2">
					<span className="inline-flex items-center rounded-full border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/40 px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
					Logged: {originalQty}{item.serving_unit} · {toNum(item.calories)} kcal
					</span>
				</div>
				</div>

				<button
				type="button"
				onClick={onClose}
				className="shrink-0 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 bg-white/70 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
				>
				Close
				</button>
			</div>
			</div>

			{/* Body */}
			<form onSubmit={handleSubmit} className="px-6 py-5 max-h-[75vh] overflow-y-auto">
			<div className="space-y-4">
				{/* Meal */}
				<div>
				<label className={labelBase}>Meal</label>
				<div className="grid grid-cols-4 gap-2">
					{MEALS.map((m) => {
					const c = mealColors[m];
					const active = meal === m;
					return (
						<button
						key={m}
						type="button"
						onClick={() => setMeal(m)}
						className={[
							"px-2 py-2 rounded text-sm capitalize border transition text-center",
							"flex items-center justify-center",
							active
							? `${c.bg} ${c.text} ${c.border} ring-2 ${c.ring}`
							: `bg-white/70 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 ${c.hover}`,
						].join(" ")}
						>
						{m}
						</button>
					);
					})}
				</div>
				</div>

				{/* Live macros */}
				<div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/50 p-3">
				<div className="grid grid-cols-4 gap-2 text-center">
					<div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
					<div className="text-[11px] text-slate-500 dark:text-slate-400">Protein</div>
					<div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{preview.protein}g</div>
					</div>
					<div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
					<div className="text-[11px] text-slate-500 dark:text-slate-400">Carbs</div>
					<div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{preview.carbs}g</div>
					</div>
					<div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
					<div className="text-[11px] text-slate-500 dark:text-slate-400">Fat</div>
					<div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{preview.fat}g</div>
					</div>
					<div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
					<div className="text-[11px] text-slate-500 dark:text-slate-400">Calories</div>
					<div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{preview.calories}</div>
					</div>
				</div>
				</div>

				{/* Amount */}
				<div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/50 p-3">
				<label className={labelBase} htmlFor="editQty">
					Quantity{item.serving_unit ? ` (${item.serving_unit})` : ""}
				</label>
				<input
					id="editQty"
					type="number"
					step={0.01}
					min={0}
					inputMode="decimal"
					value={qty}
					onChange={(e) => setQty(e.target.value)}
					disabled={!canScale}
					className={inputBase}
					placeholder="e.g., 1"
				/>
				{!canScale && (
					<p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
					This entry was logged with a quantity of 0, so it can&apos;t be rescaled. Remove it and log it again instead.
					</p>
				)}
				</div>

				{error && (
				<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
				)}

				{/* Footer actions */}
				<div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-end gap-2">
				<button
					type="button"
					onClick={onClose}
					className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
				>
					Cancel
				</button>

				<button
					type="submit"
					disabled={!qtyValid || saving}
					className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 text-sm font-medium shadow-lg shadow-indigo-500/30 ring-1 ring-white/10 hover:from-indigo-400 hover:to-purple-400 active:scale-95 transition disabled:cursor-not-allowed disabled:opacity-60"
				>
					{saving ? "Saving..." : "Save Changes"}
				</button>
				</div>
			</div>
			</form>
		</div>
		</div>
	);
}