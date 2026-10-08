"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Food } from "@/lib/dataTypes";
import { UNITS } from "@/lib/ui/servingUnits";
import { RecipeController } from "@/lib/hooks/useRecipeController";
import AddFoodToRecipe from "@/app/components/Modals/AddFoodToRecipe";

function useDebouncedValue<T>(value: T, delay = 450) {

	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const t = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(t);
	}, [value, delay]);

	return debounced;

}

function Empty({ label }: { label: string }) {
	return <div className="text-sm text-slate-500 italic">{label}</div>;
}

type Props = { rc: RecipeController };

export default function RecipeBuilder({ rc }: Props) {

	const [query, setQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Food[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const debouncedQuery = useDebouncedValue(query, 450);
	const requestSeq = useRef(0);

	const [saveError, setSaveError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);

	// run food search when query changes
	useEffect(() => {
		const q = debouncedQuery.trim();
		if (q.length < 2) {
			setSearchResults([]);
			setSearchLoading(false);
			return;
		}

		const mySeq = ++requestSeq.current;
		setSearchLoading(true);

		rc.onSearch(q)
			.then((data) => {
				if (requestSeq.current === mySeq) setSearchResults(data);
			})
			.catch(() => {
				if (requestSeq.current === mySeq) setSearchResults([]);
			})
			.finally(() => {
				if (requestSeq.current === mySeq) setSearchLoading(false);
			});
	}, [debouncedQuery]);

	const totals = useMemo(() => {
		return rc.pendingItems.reduce(
			(acc, i) => ({
				calories: acc.calories + i.calories,
				protein:  acc.protein  + i.protein,
				carbs:    acc.carbs    + i.carbs,
				fat:      acc.fat      + i.fat,
			}),
			{ calories: 0, protein: 0, carbs: 0, fat: 0 }
		);
	}, [rc.pendingItems]);

	async function handleSave() {
		setSaveError(null);
		setSaved(false);
		await rc.saveRecipe();
		if (!rc.error) {
			setSaved(true);
			setQuery("");
			setSearchResults([]);
			setTimeout(() => setSaved(false), 3000);
		} else {
			setSaveError(rc.error);
		}
	}

	return (
		<>
			<div className="text-slate-900 dark:text-slate-100">
				<div
					className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:overflow-hidden"
					style={{ height: "calc(100vh - 200px)" }}
				>
					{/* LEFT: food search */}
					<div className="md:h-full md:overflow-y-auto md:pr-1">
						<div className="sticky top-0 z-10 pb-2 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur">
							<h2 className="text-xl font-bold mb-2">Add Foods</h2>
							<input
								className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
								placeholder="Search foods…"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
							/>
						</div>

						<div className="mt-2 space-y-2">
							{searchLoading && (
								<div className="text-sm text-slate-500">Searching…</div>
							)}
							{!searchLoading && query.trim().length >= 2 && searchResults.length === 0 && (
								<Empty label="No foods match your search." />
							)}
							{!searchLoading && query.trim().length < 2 && (
								<Empty label="Type at least 2 characters to search." />
							)}
							{searchResults.map((food) => (
								<button
									key={food.id}
									onClick={() => rc.openServingPicker(food)}
									className="w-full text-left p-3 rounded-xl shadow transition border hover:-translate-y-0.5 hover:shadow-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
								>
									<p className="font-medium truncate">{food.name}</p>
									{food.brand && (
										<p className="text-xs text-slate-400 truncate">{food.brand}</p>
									)}
									<p className="text-xs text-slate-500 mt-1">
										{food.calories} kcal &nbsp;·&nbsp; P:{food.protein}g C:{food.carbs}g F:{food.fat}g
									</p>
									<p className="text-xs text-indigo-500 mt-1">Tap to set serving →</p>
								</button>
							))}
						</div>
					</div>

					{/* RIGHT: meal builder */}
					<div className="md:h-full md:overflow-y-auto md:pl-1 space-y-4">
						{/* Recipe name */}
						<div>
							<label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
								Recipe name
							</label>
							<input
								className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
								placeholder="e.g. Spaghetti bolognese"
								value={rc.recipeName}
								onChange={(e) => rc.setRecipeName(e.target.value)}
							/>
						</div>

						{/* Yield */}
						<div>
							<label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
								Total yield <span className="font-normal text-slate-500 dark:text-slate-400">(how much this recipe makes)</span>
							</label>
							<div className="flex gap-2">
								<input
									type="number"
									min={0.01}
									step={0.01}
									className="w-24 p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
									placeholder="1"
									value={rc.recipeYieldSize}
									onChange={(e) => rc.setRecipeYieldSize(e.target.value)}
								/>
								<select
									className="flex-1 p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
									value={rc.recipeYieldUnit}
									onChange={(e) => rc.setRecipeYieldUnit(e.target.value)}
								>
									<optgroup label="Count">
										{UNITS.filter(u => u.type === "count").map(u => (
											<option key={u.unit} value={u.unit}>{u.label}</option>
										))}
									</optgroup>
									<optgroup label="Weight">
										{UNITS.filter(u => u.type === "weight").map(u => (
											<option key={u.unit} value={u.unit}>{u.label}</option>
										))}
									</optgroup>
									<optgroup label="Volume">
										{UNITS.filter(u => u.type === "volume").map(u => (
											<option key={u.unit} value={u.unit}>{u.label}</option>
										))}
									</optgroup>
								</select>
							</div>
							<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
								When logging, you&apos;ll say how much of this you had — macros scale accordingly.
							</p>
						</div>

						{/* Items */}
						<div className="rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
							<div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
								<span className="font-semibold text-sm">Items</span>
								<span className="text-xs text-slate-500">
									{rc.pendingItems.length} item{rc.pendingItems.length !== 1 ? "s" : ""}
								</span>
							</div>

							<div className="p-4">
								{rc.pendingItems.length === 0 ? (
									<Empty label="Search and select foods on the left to build your meal." />
								) : (
									<div className="space-y-2">
										{rc.pendingItems.map((item) => (
											<div
												key={item.tempId}
												className="flex items-start justify-between gap-2 px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
											>
												<div className="min-w-0">
													<p className="text-sm font-medium truncate">{item.food.name}</p>
													<p className="text-xs text-slate-500">
														{item.serving_size}{item.serving_unit} &nbsp;·&nbsp; {item.calories} kcal
													</p>
													<p className="text-xs text-slate-400">
														P:{item.protein}g C:{item.carbs}g F:{item.fat}g
													</p>
												</div>
												<button
													onClick={() => rc.removeItemFromPending(item.tempId)}
													className="shrink-0 text-xs text-red-400 hover:text-red-600"
												>
													✕
												</button>
											</div>
										))}
									</div>
								)}
							</div>

							{/* Totals */}
							{rc.pendingItems.length > 0 && (
								<div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-4 gap-2 text-center">
									{[
										{ label: "Cals",    val: Math.round(totals.calories) },
										{ label: "Protein", val: `${Math.round(totals.protein)}g` },
										{ label: "Carbs",   val: `${Math.round(totals.carbs)}g` },
										{ label: "Fat",     val: `${Math.round(totals.fat)}g` },
									].map(({ label, val }) => (
										<div key={label} className="rounded bg-slate-50 dark:bg-slate-700/60 p-1">
											<div className="text-[10px] text-slate-500">{label}</div>
											<div className="text-xs font-semibold">{val}</div>
										</div>
									))}
								</div>
							)}

							{/* Footer */}
							<div className="border-t border-slate-300 dark:border-slate-700 p-4 space-y-2">
								{(saveError || rc.error) && (
									<p className="text-sm text-red-500">{saveError ?? rc.error}</p>
								)}
								{saved && (
									<p className="text-sm text-green-500">Recipe saved!</p>
								)}
								<div className="flex gap-2">
									{rc.pendingItems.length > 0 && (
										<button
											onClick={rc.clearPending}
											className="flex-1 rounded-lg border px-3 py-2 text-sm border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
										>
											Clear
										</button>
									)}
									<button
										onClick={handleSave}
										disabled={rc.saving || rc.pendingItems.length === 0 || !rc.recipeName.trim()}
										className="flex-1 rounded-lg border px-3 py-2 text-sm bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 disabled:opacity-40"
									>
										{rc.saving ? "Saving…" : "Save Meal"}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<AddFoodToRecipe
				isOpen={rc.servingPickerOpen}
				onClose={rc.closeServingPicker}
				food={rc.servingPickerFood}
				onAdd={(item) => {
					rc.addItemToPending(item);
					rc.closeServingPicker();
				}}
			/>
		</>
	);
}
