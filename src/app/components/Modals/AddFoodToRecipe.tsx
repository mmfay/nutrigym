"use client";

import { useEffect, useMemo, useState } from "react";
import { Food, PendingRecipeItem } from "@/lib/dataTypes";
import { UNITS } from "@/lib/ui/servingUnits";
import { convertVolume, convertWeight } from "@/lib/utils/conversion";

type Props = {
	isOpen: boolean;
	onClose: () => void;
	food: Food | null;
	onAdd: (item: PendingRecipeItem) => void;
};

type UnitType = "count" | "weight" | "volume";

function typeForMetric(u?: string | null): UnitType {
	const unit = (u ?? "").toLowerCase();
	if (unit === "g" || unit === "kg") return "weight";
	if (unit === "ml" || unit === "l") return "volume";
	return "count";
}

function toNum(x: unknown, fallback = 0) {
	const n = typeof x === "number" ? x : Number(x);
	return Number.isFinite(n) ? n : fallback;
}

function round1(n: number) { return Math.round(n * 10) / 10; }
function round0(n: number) { return Math.round(n); }

const inputBase =
	"w-full rounded-lg border px-3 py-2 text-base " +
	"bg-white dark:bg-slate-900/60 " +
	"text-slate-900 dark:text-slate-100 placeholder:text-slate-400 " +
	"border-slate-300 dark:border-slate-700 " +
	"focus:outline-none focus:ring-2 focus:ring-indigo-500";

const labelBase = "block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1";

export default function AddFoodToRecipe({ isOpen, onClose, food, onAdd }: Props) {

	const [loggedFood, setLoggedFood] = useState<Food | null>(null);

	useEffect(() => {
		if (!isOpen || !food) return;
		setLoggedFood(structuredClone(food));
	}, [isOpen, food]);

	const metricType = useMemo(() => typeForMetric(food?.serving_metric_unit), [food?.serving_metric_unit]);

	const unitOptions = useMemo(() => {
		if (!food) return [];
		const baseUnit = (food.serving_unit || "").toLowerCase();
		const metricUnits = UNITS.filter((x) => x.type === metricType);
		const baseOption = baseUnit ? [{ unit: baseUnit, label: food.serving_unit }] : [];
		if (!food.serving_metric_unit || !food.serving_metric_size) return baseOption;
		const metricNoDup = metricUnits.filter((u) => u.unit.toLowerCase() !== baseUnit);
		return [...baseOption, ...metricNoDup];
	}, [food, metricType]);

	if (!food || !loggedFood || !isOpen) return null;

	// Capture as const so TypeScript can prove non-null inside closures
	const f = food;
	const hasMetric = !!f.serving_metric_unit;

	function recomputeFromBase(base: Food, qtyRaw: unknown, unit: string) {
		const qty = Math.max(0, toNum(qtyRaw, 0));
		const selected = (unit || "").toLowerCase();
		const baseUnit = (base.serving_unit || "").toLowerCase();
		const usingBaseUnit = selected === baseUnit;

		let servingsEquivalent = 0;

		if (!usingBaseUnit && base.serving_metric_unit && base.serving_metric_size) {
			const to = (base.serving_metric_unit || "").toLowerCase();
			const multiplier =
				metricType === "weight"
					? convertWeight(to as any, selected as any)
					: metricType === "volume"
					? convertVolume(to as any, selected as any)
					: 1;
			const qtyInBaseMetric = qty * (Number.isFinite(multiplier) ? multiplier : 1);
			const denom = toNum(base.serving_metric_size);
			servingsEquivalent = denom > 0 ? qtyInBaseMetric / denom : 0;
		} else {
			const denom = toNum(base.serving_size);
			servingsEquivalent = denom > 0 ? qty / denom : 0;
		}

		return {
			serving_size: qty,
			serving_unit: unit,
			calories: round0(toNum(base.calories) * servingsEquivalent),
			protein: round1(toNum(base.protein) * servingsEquivalent),
			carbs: round1(toNum(base.carbs) * servingsEquivalent),
			fat: round1(toNum(base.fat) * servingsEquivalent),
		};
	}

	function handleConversion(unit_to: string) {
		setLoggedFood((prev) => {
			if (!prev) return prev;
			const from = (prev.serving_unit || "").toLowerCase();
			const to = (unit_to || "").toLowerCase();
			const baseUnit = (f.serving_unit || "").toLowerCase();
			const baseMetricUnit = (f.serving_metric_unit || "").toLowerCase();
			const prevQty = toNum(prev.serving_size);
			const hasBridge = !!f.serving_metric_unit && !!f.serving_metric_size && toNum(f.serving_size) > 0;

			if (hasBridge && ((from === baseUnit && to !== baseUnit) || (from !== baseUnit && to === baseUnit))) {
				const metricPerBase = toNum(f.serving_metric_size) / toNum(f.serving_size);
				let nextQty = prevQty;
				if (from === baseUnit && to !== baseUnit) {
					const qtyInBaseMetric = prevQty * metricPerBase;
					const multiplier =
						metricType === "weight"
							? convertWeight(to as any, baseMetricUnit as any)
							: metricType === "volume"
							? convertVolume(to as any, baseMetricUnit as any)
							: 1;
					nextQty = qtyInBaseMetric * (Number.isFinite(multiplier) ? multiplier : 1);
				} else if (from !== baseUnit && to === baseUnit) {
					const toBaseMetric =
						metricType === "weight"
							? convertWeight(baseMetricUnit as any, from as any)
							: metricType === "volume"
							? convertVolume(baseMetricUnit as any, from as any)
							: 1;
					const qtyInBaseMetric = prevQty * (Number.isFinite(toBaseMetric) ? toBaseMetric : 1);
					nextQty = metricPerBase > 0 ? qtyInBaseMetric / metricPerBase : 0;
				}
				return { ...prev, ...recomputeFromBase(f, round1(nextQty), unit_to) };
			}

			const multiplier =
				metricType === "weight"
					? convertWeight(to as any, from as any)
					: metricType === "volume"
					? convertVolume(to as any, from as any)
					: 1;
			const nextQty = round1(prevQty * (Number.isFinite(multiplier) ? multiplier : 1));
			return { ...prev, ...recomputeFromBase(f, nextQty, unit_to) };
		});
	}

	function handleQtyChange(nextQtyRaw: number) {
		setLoggedFood((prev) => {
			if (!prev) return prev;
			const unit = prev.serving_unit || f.serving_unit;
			return { ...prev, ...recomputeFromBase(f, nextQtyRaw, unit) };
		});
	}

	function handleAdd() {
		if (!loggedFood) return;
		onAdd({
			tempId: crypto.randomUUID(),
			food: f,
			serving_size: toNum(loggedFood.serving_size),
			serving_unit: loggedFood.serving_unit || f.serving_unit,
			calories: toNum(loggedFood.calories),
			protein: toNum(loggedFood.protein),
			carbs: toNum(loggedFood.carbs),
			fat: toNum(loggedFood.fat),
		});
		onClose();
	}

	return (
		<div
			className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-safe-4"
			role="dialog"
			aria-modal="true"
			onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
		>
			<div className="w-full max-w-lg rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/90 shadow-xl overflow-hidden">
				{/* Header */}
				<div className="px-6 pt-5 pb-4 border-b border-slate-200/60 dark:border-slate-700/60">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<h4 className="text-base font-semibold text-slate-900 dark:text-white">Add to Recipe</h4>
							<p className="mt-1 text-sm text-slate-600 dark:text-slate-300 truncate">{food.name}</p>

							<div className="mt-3 flex flex-wrap items-center gap-2">
								<span className="inline-flex items-center rounded-full border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/40 px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
									Per: {toNum(f.serving_size)}{f.serving_unit}
									{f.serving_metric_unit ? ` (${toNum(f.serving_metric_size)}${f.serving_metric_unit})` : ""}
								</span>
								<div className="flex flex-wrap gap-2">
									{[
										{ label: "Cals", val: toNum(f.calories) },
										{ label: "P", val: `${toNum(f.protein)}g` },
										{ label: "C", val: `${toNum(f.carbs)}g` },
										{ label: "F", val: `${toNum(f.fat)}g` },
									].map(({ label, val }) => (
										<span key={label} className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
											{label} <span className="ml-1 font-semibold">{val}</span>
										</span>
									))}
								</div>
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
				<div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
					{/* Live macros */}
					<div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/50 p-3">
						<div className="grid grid-cols-4 gap-2 text-center">
							{[
								{ label: "Protein", val: `${toNum(loggedFood.protein)}g` },
								{ label: "Carbs",   val: `${toNum(loggedFood.carbs)}g` },
								{ label: "Fat",     val: `${toNum(loggedFood.fat)}g` },
								{ label: "Calories",val: `${toNum(loggedFood.calories)}` },
							].map(({ label, val }) => (
								<div key={label} className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
									<div className="text-[11px] text-slate-500 dark:text-slate-400">{label}</div>
									<div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{val}</div>
								</div>
							))}
						</div>
					</div>

					{/* Amount */}
					<div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/50 p-3 space-y-3">
						<div className="text-sm font-medium text-slate-800 dark:text-slate-200">Amount</div>

						{hasMetric ? (
							<div className="grid grid-cols-3 gap-2">
								<div className="col-span-1">
									<label className={labelBase}>Unit</label>
									<select
										value={loggedFood.serving_unit}
										onChange={(e) => handleConversion(e.target.value)}
										className={inputBase}
									>
										{unitOptions.map((u) => (
											<option key={u.unit} value={u.unit}>{u.label}</option>
										))}
									</select>
								</div>
								<div className="col-span-2">
									<label className={labelBase}>Quantity</label>
									<input
										type="number"
										step={0.01}
										min={0}
										inputMode="decimal"
										value={loggedFood.serving_size ?? ""}
										onChange={(e) => handleQtyChange(Number(e.target.value))}
										className={inputBase}
										placeholder="e.g., 1"
									/>
								</div>
							</div>
						) : (
							<div>
								<label className={labelBase}>Quantity</label>
								<input
									type="number"
									step={0.01}
									min={0}
									inputMode="decimal"
									value={loggedFood.serving_size ?? ""}
									onChange={(e) => {
										const raw = e.target.value;
										setLoggedFood((prev) => {
											if (!prev) return prev;
											if (raw === "") {
												return { ...prev, serving_size: 0, calories: 0, protein: 0, carbs: 0, fat: 0 };
											}
											return { ...prev, ...recomputeFromBase(f, Number(raw), prev.serving_unit || f.serving_unit) };
										});
									}}
									className={inputBase}
									placeholder="e.g., 1"
								/>
							</div>
						)}

						<div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
							<span>
								Unit: <span className="font-medium text-slate-700 dark:text-slate-200">{loggedFood.serving_unit || food.serving_unit}</span>
							</span>
							<span className="tabular-nums">
								Qty: <span className="font-medium text-slate-700 dark:text-slate-200">{toNum(loggedFood.serving_size)}</span>
							</span>
						</div>
					</div>

					{/* Actions */}
					<div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-end gap-2">
						<button
							type="button"
							onClick={onClose}
							className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleAdd}
							className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 text-sm font-medium shadow-lg shadow-indigo-500/30 ring-1 ring-white/10 hover:from-indigo-400 hover:to-purple-400 active:scale-95 transition"
						>
							Add to Recipe
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
