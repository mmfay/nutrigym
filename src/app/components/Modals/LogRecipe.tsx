"use client";

import { useEffect, useMemo, useState } from "react";
import { Food, UserRecipe } from "@/lib/dataTypes";
import { Meal, mealForNow } from "@/lib/utils/meal";
import { MEALS, mealColors } from "@/lib/ui/mealColors";

type Props = {
	isOpen: boolean;
	onClose: () => void;
	recipe: UserRecipe | null;
	slot: Meal | null;
	logDate: string;
	onLog: (food: Food, meal: number, date: string) => Promise<void>;
};

function round1(n: number) { return Math.round(n * 10) / 10; }
function round0(n: number) { return Math.round(n); }

const inputBase =
	"w-full rounded-lg border px-3 py-2 text-base " +
	"bg-white dark:bg-slate-900/60 " +
	"text-slate-900 dark:text-slate-100 placeholder:text-slate-400 " +
	"border-slate-300 dark:border-slate-700 " +
	"focus:outline-none focus:ring-2 focus:ring-indigo-500";

const labelBase = "block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1";

export default function AddRecipeToLog({ isOpen, onClose, recipe, slot, logDate, onLog }: Props) {

	const [qty, setQty] = useState("");
	const [meal, setMeal] = useState<Meal>(mealForNow());
	const [logging, setLogging] = useState(false);

	useEffect(() => {
		if (isOpen && recipe) {
			setQty(String(recipe.yield_size));
			setMeal(slot ?? mealForNow());
		}
	}, [isOpen, recipe, slot]);

	const totalBase = useMemo(() => {
		if (!recipe) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
		return {
			calories: round0(recipe.items.reduce((s, i) => s + Number(i.calories), 0)),
			protein:  round1(recipe.items.reduce((s, i) => s + Number(i.protein),  0)),
			carbs:    round1(recipe.items.reduce((s, i) => s + Number(i.carbs),    0)),
			fat:      round1(recipe.items.reduce((s, i) => s + Number(i.fat),      0)),
		};
	}, [recipe]);

	const scaled = useMemo(() => {
		if (!recipe) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
		const q = Number(qty);
		const scale = recipe.yield_size > 0 && Number.isFinite(q) && q > 0
			? q / recipe.yield_size
			: 0;
		return {
			calories: round0(totalBase.calories * scale),
			protein:  round1(totalBase.protein  * scale),
			carbs:    round1(totalBase.carbs     * scale),
			fat:      round1(totalBase.fat       * scale),
		};
	}, [recipe, qty, totalBase]);

	if (!isOpen || !recipe) return null;

	async function handleLog(e: React.FormEvent) {
		e.preventDefault();
		const q = Number(qty);
		if (!recipe || !Number.isFinite(q) || q <= 0) return;
		const food: Food = {
			id: null,
			name: recipe.name,
			brand: "",
			calories: scaled.calories,
			protein: scaled.protein,
			carbs: scaled.carbs,
			fat: scaled.fat,
			serving_size: q,
			serving_unit: recipe.yield_unit,
			is_verified: false,
		};
		setLogging(true);
		await onLog(food, MEALS.indexOf(meal), logDate);
		setLogging(false);
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
							<h4 className="text-base font-semibold text-slate-900 dark:text-white">Log Recipe</h4>
							<p className="mt-1 text-sm text-slate-600 dark:text-slate-300 truncate">{recipe.name}</p>

							<div className="mt-3 flex flex-wrap items-center gap-2">
								<span className="inline-flex items-center rounded-full border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/40 px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
									Yield: {recipe.yield_size} {recipe.yield_unit}
								</span>
								<div className="flex flex-wrap gap-2">
									<span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
										Cals <span className="ml-1 font-semibold">{totalBase.calories}</span>
									</span>
									<span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
										P <span className="ml-1 font-semibold">{totalBase.protein}</span>g
									</span>
									<span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
										C <span className="ml-1 font-semibold">{totalBase.carbs}</span>g
									</span>
									<span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
										F <span className="ml-1 font-semibold">{totalBase.fat}</span>g
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
				<form onSubmit={handleLog} className="px-6 py-5 max-h-[75vh] overflow-y-auto">
					<div className="space-y-4">

						{/* Meal selector */}
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
												"px-2 py-2 rounded text-sm capitalize border transition text-center flex items-center justify-center",
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
								{[
									{ label: "Protein",  val: `${scaled.protein}g` },
									{ label: "Carbs",    val: `${scaled.carbs}g` },
									{ label: "Fat",      val: `${scaled.fat}g` },
									{ label: "Calories", val: `${scaled.calories}` },
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
							<div>
								<label className={labelBase} htmlFor="recipe-qty">
									Quantity ({recipe.yield_unit})
								</label>
								<input
									id="recipe-qty"
									type="number"
									step={0.01}
									min={0}
									inputMode="decimal"
									value={qty}
									onChange={(e) => setQty(e.target.value)}
									className={inputBase}
									placeholder={String(recipe.yield_size)}
								/>
							</div>
							<div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
								<span>
									Unit: <span className="font-medium text-slate-700 dark:text-slate-200">{recipe.yield_unit}</span>
								</span>
								<span className="tabular-nums">
									Qty: <span className="font-medium text-slate-700 dark:text-slate-200">{qty || 0}</span>
								</span>
							</div>
						</div>

						{/* Footer */}
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
								disabled={logging || !qty || Number(qty) <= 0}
								className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 text-sm font-medium shadow-lg shadow-indigo-500/30 ring-1 ring-white/10 hover:from-indigo-400 hover:to-purple-400 active:scale-95 transition disabled:opacity-40"
							>
								{logging ? "Logging…" : "Log Recipe"}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
