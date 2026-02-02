"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import type React from "react";
import { Scanner } from "./Scanner";
import { addFood } from "@/lib/api/food/food";
import { FoodInput } from "@/lib/dataTypes";
import { WEIGHT_TO_G, MeasureUnit } from "@/lib/utils/conversion";

// props of the form
type AddFoodFormProps = {
	initial?: Partial<FoodInput>;
	submitting?: boolean;
	error?: string | null;
};

export default function AddFoodForm({
	initial,
	submitting,
	error
}: AddFoodFormProps) {

	// Form States
	const [name, setName] 			= useState(initial?.name ?? "");
	const [brand, setBrand] 		= useState(initial?.brand ?? "");
	const [calories, setCalories] 	= useState(String(initial?.calories ?? ""));
	const [fat, setFat] 			= useState(String(initial?.fat ?? ""));
	const [carbs, setCarbs] 		= useState(String(initial?.carbs ?? ""));
	const [protein, setProtein] 	= useState(String(initial?.protein ?? ""));
	const [servingSize, setServingSize] = useState(String(initial?.servingQty ?? ""));
	const [barcode, setBarcode] 		= useState(initial?.barcode ?? "");

	// Serving Mode
	const [servingMode, setServingMode] = useState<"COUNT" | "MEASURE">(
		(initial?.servingMode as any) ?? "COUNT"
	);

	// Shared qty + unit (used in both modes)
	const [qty, setQty] = useState<string>("");
	const [unit, setUnit] = useState<MeasureUnit>("g");

	// COUNT-only label (e.g., "bar")
	const [countThing, setCountThing] = useState<string>(
		initial?.servingMode === "COUNT" ? initial?.countName ?? "bar" : "bar"
	);

	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const [showScanner, setShowScanner] = useState(false);

	const toNum = (s: string) => (s.trim() === "" ? NaN : Number(s));
	const nonNeg = (n: number) => !Number.isNaN(n) && n >= 0;

	// Derive grams from qty + unit (both modes)
	const derivedGrams = useMemo(() => {
		const q = toNum(qty);
		if (!(nonNeg(q) && q > 0)) return NaN;
		const factor = WEIGHT_TO_G[unit] ?? 1;
		return q * factor;
	}, [qty, unit]);

	useEffect(() => {
		if (!Number.isNaN(derivedGrams)) setServingSize(String(derivedGrams));
		else setServingSize("");
	}, [derivedGrams]);

	const issues = useMemo(() => {
		const cals = toNum(calories);
		const f = toNum(fat);
		const c = toNum(carbs);
		const p = toNum(protein);
		const sz = toNum(servingSize);
		const q = toNum(qty);

		const errs: Partial<Record<keyof FoodInput | "form" | "servingMeta", string>> = {};
		if (!name.trim()) errs.name = "Name is required.";
		if (!nonNeg(cals)) errs.calories = "Calories must be 0 or more.";
		if (!nonNeg(f)) errs.fat = "Fat must be 0 or more.";
		if (!nonNeg(c)) errs.carbs = "Carbs must be 0 or more.";
		if (!nonNeg(p)) errs.protein = "Protein must be 0 or more.";

		// qty/unit are always shown → always required
		if (!(nonNeg(q) && q > 0)) errs.servingMeta = "Enter a quantity > 0.";
		if (!(nonNeg(sz) && sz > 0)) errs.serving = "Quantity × unit must yield > 0 grams.";

		if (servingMode === "COUNT") {
		if (!countThing.trim()) errs.servingMeta = "Enter a label (e.g., bar, egg).";
		}

		// Heuristic kcal check
		if (nonNeg(cals) && nonNeg(f) && nonNeg(c) && nonNeg(p)) {
		const expected = 4 * c + 4 * p + 9 * f;
		const low = expected * 0.8;
		const high = expected * 1.2;
		if (cals < low || cals > high) {
			errs.form = "Calories look off vs macros (rule of thumb: 4c + 4p + 9f).";
		}
		}
		return errs;
	}, [name, calories, fat, carbs, protein, servingSize, servingMode, countThing, qty]);

	const hasFieldErrors =
		!!issues.name ||
		!!issues.calories ||
		!!issues.fat ||
		!!issues.carbs ||
		!!issues.protein ||
		!!issues.servingQty ||
		!!issues.servingMeta;

	async function handleSubmit(e: React.FormEvent) {
		
		e.preventDefault();

		setTouched({
			name: true,
			brand: true,
			calories: true,
			fat: true,
			carbs: true,
			protein: true,
			servingSize: true,
			barcode: true,
			servingMeta: true,
		});

		if (hasFieldErrors) return;

		const countMode = servingMode === "COUNT" ? true : false;
		
		const payload: FoodInput = {
			name: name.trim(),
			brand: brand.trim() || 'Generic',
			calories: Number(calories),
			fat: Number(fat),
			carbs: Number(carbs),
			protein: Number(protein),
			servingMode: servingMode,
			servingUnit: 	(unit as string),
			servingQty: 	Number(qty),
			countUnit: 		countMode ? countThing.trim()	: "",
			countQty:		countMode ? 1					: 1,
			barcode: barcode.trim() || undefined,
		};

		try {
			await addFood(payload);
		} catch (err) {
			console.log(err);
		}
	}

	const inputBase = "w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500";
	const labelBase = "block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1";
	const errText = "mt-1 text-xs text-red-600";

	return (
		<form onSubmit={handleSubmit} className="space-y-5 max-w-md">
		<div className="flex items-center justify-between">
			<h4 className="text-base font-semibold">Food details</h4>
			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => setShowScanner(true)}
					className="rounded-lg border px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
					title="Use your camera to scan a barcode"
				>
					📷 Scan barcode
				</button>
			</div>
		</div>

		{/* Barcode */}
		<div>
			<label className={labelBase} htmlFor="barcode">Barcode / UPC (optional)</label>
			<input
				id="barcode"
				className={inputBase}
				value={barcode}
				onChange={(e) => setBarcode(e.target.value)}
				onBlur={() => setTouched((t) => ({ ...t, barcode: true }))}
				placeholder="e.g., 041196910145"
				autoComplete="off"
			/>
		</div>

		{/* Food Name */}	
		<div>
			<label className={labelBase} htmlFor="name">Name *</label>
			<input
				id="name"
				className={inputBase}
				value={name}
				onChange={(e) => setName(e.target.value)}
				onBlur={() => setTouched((t) => ({ ...t, name: true }))}
				placeholder="e.g., Kellogg’s Nutri-Grain Bar — Strawberry"
				autoComplete="off"
			/>
			{touched.name && issues.name && <p className={errText}>{issues.name}</p>}
		</div>

		{/* Food Brand */}	
		<div>
			<label className={labelBase} htmlFor="brand">Brand</label>
			<input
				id="brand"
				className={inputBase}
				value={brand}
				onChange={(e) => setBrand(e.target.value)}
				onBlur={() => setTouched((t) => ({ ...t, brand: true }))}
				placeholder="e.g., Kellogg’s"
				autoComplete="off"
			/>
		</div>

		{/* Calories */}
		<div>
			<label className={labelBase} htmlFor="calories">Calories *</label>
			<input
			id="calories"
			inputMode="decimal"
			type="number"
			min={0}
			step="1"
			className={inputBase}
			value={calories}
			onChange={(e) => setCalories(e.target.value)}
			onBlur={() => setTouched((t) => ({ ...t, calories: true }))}
			placeholder="e.g., 130"
			/>
			{touched.calories && issues.calories && <p className={errText}>{issues.calories}</p>}
		</div>

		{/* Macros */}
		<div className="grid grid-cols-3 gap-4">
			{/* Fat */}	
			<div>
				<label className={labelBase} htmlFor="fat">Fat (g) *</label>
				<input
					id="fat"
					inputMode="decimal"
					type="number"
					min={0}
					step="0.1"
					className={inputBase}
					value={fat}
					onChange={(e) => setFat(e.target.value)}
					onBlur={() => setTouched((t) => ({ ...t, fat: true }))}
					placeholder="e.g., 3"
				/>
				{touched.fat && issues.fat && <p className={errText}>{issues.fat}</p>}
			</div>
			{/* Carbs */}	
			<div>
				<label className={labelBase} htmlFor="carbs">Carbs (g) *</label>
				<input
					id="carbs"
					inputMode="decimal"
					type="number"
					min={0}
					step="0.1"
					className={inputBase}
					value={carbs}
					onChange={(e) => setCarbs(e.target.value)}
					onBlur={() => setTouched((t) => ({ ...t, carbs: true }))}
					placeholder="e.g., 25"
				/>
				{touched.carbs && issues.carbs && <p className={errText}>{issues.carbs}</p>}
			</div>
			{/* Protein */}	
			<div>
				<label className={labelBase} htmlFor="protein">Protein (g) *</label>
				<input
					id="protein"
					inputMode="decimal"
					type="number"
					min={0}
					step="0.1"
					className={inputBase}
					value={protein}
					onChange={(e) => setProtein(e.target.value)}
					onBlur={() => setTouched((t) => ({ ...t, protein: true }))}
					placeholder="e.g., 2"
				/>
				{touched.protein && issues.protein && <p className={errText}>{issues.protein}</p>}
			</div>
		</div>

		{/* Serving expression */}
		<div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-3">
			<div className="flex items-center gap-3">
				<span className="text-sm font-medium">Label serving expressed as:</span>
				<label className="flex items-center gap-1 text-sm">
					<input
					type="radio"
					name="servingMode"
					checked={servingMode === "COUNT"}
					onChange={() => setServingMode("COUNT")}
					/>
					Count
				</label>
				<label className="flex items-center gap-1 text-sm">
					<input
					type="radio"
					name="servingMode"
					checked={servingMode === "MEASURE"}
					onChange={() => setServingMode("MEASURE")}
					/>
					Measure
				</label>
			</div>

			{/* Qty + Unit → always shown */}
			<div className="grid grid-cols-2 gap-3">
				<div>
					<label className={labelBase} htmlFor="qty">Quantity *</label>
					<input
					id="qty"
					type="number"
					inputMode="decimal"
					min={0}
					step="0.5"
					className={inputBase}
					value={qty}
					onChange={(e) => setQty(e.target.value)}
					onBlur={() => setTouched((t) => ({ ...t, servingMeta: true }))}
					placeholder={servingMode === "MEASURE" ? "e.g., 6" : "e.g., 1.3"}
					/>
				</div>
				<div>
					<label className={labelBase} htmlFor="unit">Unit *</label>
					<select
					id="unit"
					className={inputBase}
					value={unit}
					onChange={(e) => setUnit(e.target.value as MeasureUnit)}
					onBlur={() => setTouched((t) => ({ ...t, servingMeta: true }))}
					>
					<option value="g">g</option>
					<option value="oz">oz</option>
					<option value="lb">lb</option>
					</select>
				</div>
			</div>

			{/* COUNT-only: label field */}
			{servingMode === "COUNT" && (
				<div className="mt-3">
					<label className={labelBase} htmlFor="countThing">Serving Label *</label>
					<input
					id="countThing"
					type="text"
					className={inputBase}
					value={countThing}
					onChange={(e) => setCountThing(e.target.value)}
					onBlur={() => setTouched((t) => ({ ...t, servingMeta: true }))}
					placeholder='e.g., "bar", "egg"'
					/>
					<p className="mt-1 text-xs text-gray-500">
					One serving equals 1 {countThing || "item"}.
					</p>
				</div>
			)}

			{/* Validation message for the serving area */}
			{touched.servingMeta && issues.servingMeta && (
				<p className={errText}>{issues.servingMeta}</p>
			)}
		</div>

		{(issues.form || error) && (
			<div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
			{error ?? issues.form}
			</div>
		)}

		<div className="flex items-center gap-3">
			<button
				type="submit"
				disabled={submitting}
				className="rounded-xl px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
			>
				{submitting ? "Saving..." : "Add Food"}
			</button>
			<p className="text-xs text-gray-500">Fields marked * are required.</p>
		</div>

		{/* Scanner Component */}
		{showScanner && (
			<Scanner
				onClose={() => setShowScanner(false)}
				onDetected={(code) => {
					setBarcode(code);
					setShowScanner(false);
				}}
			/>
		)}

		</form>
	);
}

