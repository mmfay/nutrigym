"use client";

import { useEffect, useMemo, useState } from "react";
import { Food } from "@/lib/dataTypes";
import { UNITS } from "@/lib/ui/servingUnits";
import { convertVolume, convertWeight } from "@/lib/utils/conversion";
import { Meal, mealForNow } from "@/lib/utils/meal";
import { MEALS, mealColors } from "@/lib/ui/mealColors";

type AddFoodToLogProps = {
	isOpen: boolean;
	onClose: () => void;
	food: Food; 
	logDate: string;
	onLog: (food: Food, meal: number, date: string) => Promise<void>;
};

type UnitType = "count" | "weight" | "volume";

// helps for choosing multiplier
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

// rounding helpers
function round1(n: number) {
	return Math.round(n * 10) / 10;
}

function round0(n: number) {
	return Math.round(n);
}

export default function AddFoodToLog({ isOpen, onClose, food, logDate, onLog }: AddFoodToLogProps) {

	// clone the passed food, so we have a base and one to calc
	const [loggedFood, setLoggedFood] = useState<Food>(() => structuredClone(food));

	// Meal selector
	const [meal, setMeal] = useState<Meal>(mealForNow());
	const mealToId = (m: Meal) => MEALS.indexOf(m); // 0..3

	// Shared UI primitives (match AddFood modal)
	const inputBase =
		"w-full rounded-lg border px-3 py-2 text-base " +
		"bg-white dark:bg-slate-900/60 " +
		"text-slate-900 dark:text-slate-100 placeholder:text-slate-400 " +
		"border-slate-300 dark:border-slate-700 " +
		"focus:outline-none focus:ring-2 focus:ring-indigo-500";

	const labelBase = "block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1";

	// When modal opens (or food changes), reset working copy + defaults
	useEffect(() => {
		if (!isOpen) return;
		setLoggedFood(structuredClone(food));
		setMeal(mealForNow());
	}, [isOpen, food]);

	// get metric type volume/weight/count
	const metricType = useMemo(() => typeForMetric(food?.serving_metric_unit), [food?.serving_metric_unit]);

	// build drop down list for conversions
	const unitOptions = useMemo(() => {
		const baseUnit = (food?.serving_unit || "").toLowerCase();
		const metricUnits = UNITS.filter((x) => x.type === metricType);

		const baseOption = baseUnit ? [{ unit: baseUnit, label: food.serving_unit }] : [];

		if (!food?.serving_metric_unit || !food?.serving_metric_size) return baseOption;

		const metricNoDup = metricUnits.filter((u) => u.unit.toLowerCase() !== baseUnit);

		return [...baseOption, ...metricNoDup];
	}, [food?.serving_unit, food?.serving_metric_unit, food?.serving_metric_size, metricType]);

	// dont show when not present
	if (!food || !loggedFood || !isOpen) return null;

  	const hasMetric = !!food.serving_metric_unit;

	// always recalculating the macros from base to prevent issues when set to 0
	function recomputeFromBase(base: Food, qtyRaw: unknown, unit: string) {

		const qty = Math.max(0, toNum(qtyRaw, 0));
		const selected = (unit || "").toLowerCase();
		const baseUnit = (base.serving_unit || "").toLowerCase();

		const usingBaseUnit = selected === baseUnit;

		let servingsEquivalent = 0;

		if (!usingBaseUnit && base.serving_metric_unit && base.serving_metric_size) {
			const from = selected;
			const to = (base.serving_metric_unit || "").toLowerCase();

			const multiplier =
				metricType === "weight"
				? convertWeight(to as any, from as any)
				: metricType === "volume"
				? convertVolume(to as any, from as any)
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

	// handle the conversion qty when flipping base
	function handleConversion(unit_to: string) {

		setLoggedFood((prev) => {

			const from = (prev.serving_unit || "").toLowerCase();
			const to = (unit_to || "").toLowerCase();

			const baseUnit = (food.serving_unit || "").toLowerCase();
			const baseMetricUnit = (food.serving_metric_unit || "").toLowerCase();

			const prevQty = toNum(prev.serving_size);

			const hasBridge = !!food.serving_metric_unit && !!food.serving_metric_size && toNum(food.serving_size) > 0;

			if (hasBridge && ((from === baseUnit && to !== baseUnit) || (from !== baseUnit && to === baseUnit))) {
				const metricPerBase = toNum(food.serving_metric_size) / toNum(food.serving_size);

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

				const derived = recomputeFromBase(food, round1(nextQty), unit_to);
				return { ...prev, ...derived };
			}

			const multiplier =
				metricType === "weight"
				? convertWeight(to as any, from as any)
				: metricType === "volume"
				? convertVolume(to as any, from as any)
				: 1;

			const nextQty = round1(prevQty * (Number.isFinite(multiplier) ? multiplier : 1));
			const derived = recomputeFromBase(food, nextQty, unit_to);

			return { ...prev, ...derived };
		});
	}

	function handleMacroConversion(nextServingSizeRaw: number) {
		setLoggedFood((prev) => {
			const unit = prev.serving_unit || food.serving_unit;
			const derived = recomputeFromBase(food, nextServingSizeRaw, unit);
			return { ...prev, ...derived };
		});
	}

	return (
		<div
		className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4"
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
				<h4 className="text-base font-semibold text-slate-900 dark:text-white">Log Food</h4>
				<p className="mt-1 text-sm text-slate-600 dark:text-slate-300 truncate">{food.name}</p>

				{/* Base Serving (from food) */}
				<div className="mt-3 flex flex-wrap items-center gap-2">
					<span className="inline-flex items-center rounded-full border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/40 px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
					Per: {toNum(food.serving_size)}
					{food.serving_unit}
					{food.serving_metric_unit ? ` (${toNum(food.serving_metric_size)}${food.serving_metric_unit})` : ""}
					</span>

					<div className="flex flex-wrap gap-2">
					<span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
						Cals <span className="ml-1 font-semibold">{toNum(food.calories)}</span>
					</span>
					<span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
						P <span className="ml-1 font-semibold">{toNum(food.protein)}</span>g
					</span>
					<span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
						C <span className="ml-1 font-semibold">{toNum(food.carbs)}</span>g
					</span>
					<span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
						F <span className="ml-1 font-semibold">{toNum(food.fat)}</span>g
					</span>
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
			<form
			onSubmit={async (e) => {
				e.preventDefault();
				await onLog(loggedFood, mealToId(meal), logDate);
				onClose();
			}}
			className="px-6 py-5 max-h-[75vh] overflow-y-auto"
			>
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
					<div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{toNum(loggedFood.protein)}g
					</div>
					</div>
					<div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
					<div className="text-[11px] text-slate-500 dark:text-slate-400">Carbs</div>
					<div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{toNum(loggedFood.carbs)}g
					</div>
					</div>
					<div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
					<div className="text-[11px] text-slate-500 dark:text-slate-400">Fat</div>
					<div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{toNum(loggedFood.fat)}g
					</div>
					</div>
					<div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
					<div className="text-[11px] text-slate-500 dark:text-slate-400">Calories</div>
					<div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{toNum(loggedFood.calories)}
					</div>
					</div>
				</div>
				</div>

				{/* Amount */}
				<div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/50 p-3 space-y-3">
				<div className="flex items-center justify-between gap-3">
					<div className="text-sm font-medium text-slate-800 dark:text-slate-200">Amount</div>
					{food.serving_metric_unit && food.serving_metric_size ? (
					<div className="text-xs text-slate-500 dark:text-slate-400">
						{toNum(food.serving_metric_size)} {food.serving_metric_unit} per {food.serving_unit}
					</div>
					) : null}
				</div>

				{hasMetric ? (
					<div className="grid grid-cols-3 gap-2">
					<div className="col-span-1">
						<label className={labelBase} htmlFor="unit">
						Unit
						</label>
						<select
						id="unit"
						value={loggedFood.serving_unit}
						onChange={(e) => handleConversion(e.target.value)}
						className={inputBase}
						>
						{unitOptions.map((u) => (
							<option key={u.unit} value={u.unit}>
							{u.label}
							</option>
						))}
						</select>
					</div>

					<div className="col-span-2">
						<label className={labelBase} htmlFor="qty">
						Quantity
						</label>
						<input
						id="qty"
						type="number"
						step={0.01}
						min={0}
						inputMode="decimal"
						value={loggedFood.serving_size ?? ""}
						onChange={(e) => handleMacroConversion(Number(e.target.value))}
						className={inputBase}
						aria-label="Quantity"
						placeholder="e.g., 1"
						/>
					</div>
					</div>
				) : (
					<div>
					<label className={labelBase} htmlFor="qtyBasic">
						Quantity
					</label>
					<input
						id="qtyBasic"
						type="number"
						step={0.01}
						min={0}
						inputMode="decimal"
						value={loggedFood.serving_size ?? ""}
						onChange={(e) => {
						const raw = e.target.value;

						setLoggedFood((prev) => {
							if (raw === "") {
							return {
								...prev,
								serving_size: "" as any,
								calories: 0 as any,
								protein: 0 as any,
								carbs: 0 as any,
								fat: 0 as any,
							};
							}

							const derived = recomputeFromBase(food, Number(raw), prev.serving_unit || food.serving_unit);
							return { ...prev, ...derived };
						});
						}}
						className={inputBase}
						aria-label="Quantity"
						placeholder="e.g., 1"
					/>
					</div>
				)}

				<div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
					<span>
					Displaying in:{" "}
					<span className="font-medium text-slate-700 dark:text-slate-200">
						{loggedFood.serving_unit || food.serving_unit}
					</span>
					</span>
					<span className="tabular-nums">
					Qty:{" "}
					<span className="font-medium text-slate-700 dark:text-slate-200">
						{toNum(loggedFood.serving_size)}
					</span>
					</span>
				</div>
				</div>

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
					className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 text-sm font-medium shadow-lg shadow-indigo-500/30 ring-1 ring-white/10 hover:from-indigo-400 hover:to-purple-400 active:scale-95 transition"
				>
					Log Food
				</button>
				</div>
			</div>
			</form>
		</div>
		</div>
	);
}