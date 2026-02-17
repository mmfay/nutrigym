import { useEffect, useState, useMemo } from "react";
import { Scanner } from "../Scanner";
import { FoodCreate, FoodInput } from "@/lib/dataTypes";
import { Section } from "../Section";
import { toNum, nonNeg } from "@/lib/services/numbers";

type AddFoodProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  onCreate: (food: FoodCreate) => void;
};

export default function AddFood({ isOpen, onClose, onOpen, onCreate }: AddFoodProps) {

	// states
	const [showScanner, setShowScanner] = useState(false);
	const [touched, setTouched] = useState<Record<string, boolean>>({});

	const [name, setName] = useState("");
	const [brand, setBrand] = useState("");
	const [barcode, setBarcode] = useState("");

	const [calories, setCalories] = useState("");
	const [fat, setFat] = useState("");
	const [carbs, setCarbs] = useState("");
	const [protein, setProtein] = useState("");

	const [qty, setQty] = useState<string>("");
	const [unit, setUnit] = useState<string>("g");
	const [servingMode, setServingMode] = useState<"COUNT" | "MEASURE">("COUNT");

	// Collapsible states
	const [openBasic, setOpenBasic] = useState(true);
	const [openNutrition, setOpenNutrition] = useState(false);
	const [openServing, setOpenServing] = useState(false);

	// Auto-expand sections if user starts typing there
	useEffect(() => {
		if (calories || fat || carbs || protein) setOpenNutrition(true);
	}, [calories, fat, carbs, protein]);

	useEffect(() => {
		if (qty || unit !== "g" || servingMode !== "COUNT") setOpenServing(true);
	}, [qty, unit, servingMode]);

	const inputBase =
		"w-full rounded-lg border px-3 py-2 text-sm " +
		"bg-white dark:bg-slate-900/60 " +
		"text-slate-900 dark:text-slate-100 placeholder:text-slate-400 " +
		"border-slate-300 dark:border-slate-700 " +
		"focus:outline-none focus:ring-2 focus:ring-indigo-500";

	const labelBase = "block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1";

	const errText = "mt-1 text-xs text-red-600";

	// submission of the new item
	function handleSubmit(e: React.FormEvent) {
			e.preventDefault();
			onCreate({
				name,
				brand,
				barcode,
				calories: Number(calories),
				fat: Number(fat),
				carbs: Number(carbs),
				protein: Number(protein),
				serving_size: Number(qty),
				serving_unit: unit
			});

		onClose();
	}

	const issues = useMemo(() => {

		const cals = toNum(calories);
		const f = toNum(fat);
		const c = toNum(carbs);
		const p = toNum(protein);

		const errors: Partial<Record<keyof FoodInput | "form" | "servingMeta", string>> = {};

		if (!nonNeg(cals)) errors.calories = "Calories must be 0 or more.";
		if (!nonNeg(f)) errors.fat = "Fat must be 0 or more.";
		if (!nonNeg(c)) errors.carbs = "Carbs must be 0 or more.";
		if (!nonNeg(p)) errors.protein = "Protein must be 0 or more.";

		// Heuristic kcal check
		if (nonNeg(cals) && nonNeg(f) && nonNeg(c) && nonNeg(p)) {

			const expected = 4 * c + 4 * p + 9 * f;
			const low = expected * 0.8;
			const high = expected * 1.2;
			if (cals < low || cals > high) {
				errors.form = "Calories look off vs macros (rule of thumb: 4c + 4p + 9f).";
			}

		}
		return errors;
	}, [calories, fat, carbs, protein]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4">
		<div className="w-full max-w-lg rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/90 shadow-xl overflow-hidden">
			{/* Header */}
			<div className="px-6 pt-5 pb-4 border-b border-slate-200/60 dark:border-slate-700/60">
			<div className="flex items-start justify-between gap-3">
				<div>
				<h4 className="text-base font-semibold text-slate-900 dark:text-white">
					Food details
				</h4>
				<p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
					Add the basics now — fill nutrition when you’re ready.
				</p>
				</div>

				<button
				type="button"
				onClick={() => setShowScanner(true)}
				className="shrink-0 rounded-xl border border-slate-300 dark:border-slate-700
							px-3 py-2 text-xs text-slate-800 dark:text-slate-100
							bg-white/70 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
				title="Use your camera to scan a barcode"
				>
				📷 Scan barcode
				</button>
			</div>
			</div>

			{/* Body */}
			<form onSubmit={handleSubmit} className="px-6 py-5 max-h-[75vh] overflow-y-auto">
			<div className="space-y-4">
				{/* BASIC */}
				<Section
				title="Basic info"
				subtitle="Name, brand, barcode"
				open={openBasic}
				onToggle={() => setOpenBasic((v) => !v)}
				>
				<div className="space-y-4">
					{/* Barcode */}
					<div>
					<label className={labelBase} htmlFor="barcode">
						Barcode / UPC (optional)
					</label>
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

					{/* Name + Brand */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label className={labelBase} htmlFor="name">
						Name *
						</label>
						<input
						id="name"
						className={inputBase}
						value={name}
						onChange={(e) => setName(e.target.value)}
						onBlur={() => setTouched((t) => ({ ...t, name: true }))}
						placeholder="e.g., Nutri-Grain Bar — Strawberry"
						autoComplete="off"
						/>
					</div>

					<div>
						<label className={labelBase} htmlFor="brand">
						Brand
						</label>
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
					</div>
				</div>
				</Section>

				{/* NUTRITION */}
				<Section
				title="Nutrition"
				subtitle="Calories + macros"
				open={openNutrition}
				onToggle={() => setOpenNutrition((v) => !v)}
				>
				<div className="space-y-4">
					{/* Calories */}
					<div>
					<label className={labelBase} htmlFor="calories">
						Calories *
					</label>
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
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div>
						<label className={labelBase} htmlFor="fat">
						Fat (g) *
						</label>
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

					<div>
						<label className={labelBase} htmlFor="carbs">
						Carbs (g) *
						</label>
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

					<div>
						<label className={labelBase} htmlFor="protein">
						Protein (g) *
						</label>
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
				</div>
				</Section>

				{/* SERVING */}
				<Section
				title="Serving"
				subtitle="How the label serving is expressed"
				open={openServing}
				onToggle={() => setOpenServing((v) => !v)}
				>
				<div className="space-y-4">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
					<span className="text-sm font-medium text-slate-900 dark:text-white">
						Label serving expressed as:
					</span>

					<div className="flex items-center gap-4">
						<label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
						<input
							type="radio"
							name="servingMode"
							checked={servingMode === "COUNT"}
							onChange={() => setServingMode("COUNT")}
						/>
						Count
						</label>
						<label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
						<input
							type="radio"
							name="servingMode"
							checked={servingMode === "MEASURE"}
							onChange={() => setServingMode("MEASURE")}
						/>
						Measure
						</label>
					</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label className={labelBase} htmlFor="qty">
						Quantity *
						</label>
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
						<label className={labelBase} htmlFor="unit">
						Unit *
						</label>
						<select
						id="unit"
						className={inputBase}
						value={unit}
						onChange={(e) => setUnit(e.target.value)}
						onBlur={() => setTouched((t) => ({ ...t, servingMeta: true }))}
						>
						<option value="g">g</option>
						<option value="kg">kg</option>
						<option value="oz">oz</option>
						<option value="lb">lb</option>
						<option value="ml">ml</option>
						<option value="l">l</option>
						<option value="tsp">tsp</option>
						<option value="tbsp">tbsp</option>
						<option value="cup">cup</option>
						<option value="floz">fl oz</option>
						<option value="pt">pt</option>
						<option value="qt">qt</option>
						<option value="gal">gal</option>
						<option value="each">each</option>
						<option value="piece">piece</option>
						<option value="slice">slice</option>
						<option value="packet">packet</option>
						<option value="can">can</option>
						<option value="bottle">bottle</option>
						<option value="container">container</option>
						</select>
					</div>
					</div>
				</div>
				</Section>

				{/* Footer actions */}
				<div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-end gap-2">
				<button
					type="button"
					onClick={onClose}
					className="rounded-xl border border-slate-300 dark:border-slate-700
							px-4 py-2 text-sm text-slate-800 dark:text-slate-100
							hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
				>
					Cancel
				</button>

				<button
					type="submit"
					className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500
							text-white px-4 py-2 text-sm font-medium
							shadow-lg shadow-indigo-500/30 ring-1 ring-white/10
							hover:from-indigo-400 hover:to-purple-400
							active:scale-95 transition"
				>
					Save food
				</button>
				</div>
			</div>
			</form>

			{/* Scanner */}
			{showScanner && (
			<Scanner
				onClose={() => setShowScanner(false)}
				onDetected={(code) => {
				setBarcode(code);
				setShowScanner(false);
				setOpenBasic(true); // keep them in context
				}}
			/>
			)}
		</div>
		</div>
	);
}
