"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import { Copy } from "lucide-react";
import { Food } from "@/lib/dataTypes";
import { todayLocalISO, formatShortDate } from "@/lib/utils/date";
import { Meal, mealForNow } from "@/lib/utils/meal";
import AddFoodToLog from "@/app/components/Modals/AddFoodToLog";
import AddFood from "@/app/components/Modals/AddFood";
import AddRecipeToLog from "@/app/components/Modals/LogRecipe";
import { useFoodController, useRecipeController } from "@/lib/hooks";
import Tag from "@/app/components/Tag";
import RecipeCard from "@/app/components/RecipeCard";
import MacroAI from "@/app/components/Modals/MacroAI";
import EditLoggedFood from "@/app/components/Modals/EditLoggedFood";
import FoodCard from "@/app/components/FoodCard";

// ---------- Types ----------
type Mode = "recent" | "all" | "recipes";

// ---------- Dummy Data (for "All") ----------
const MEALS: Meal[] = ["breakfast","lunch","dinner","snack"];

// ---------- Meal Colors (chips & headers only) ----------
const mealColors: Record<Meal, { bg: string; text: string; ring: string; hover: string; border: string; muted: string }> = {
	breakfast: { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-800 dark:text-sky-100", ring: "ring-sky-300/60 dark:ring-sky-500/40", hover: "hover:bg-sky-200 dark:hover:bg-sky-900/50", border: "border-sky-300/70 dark:border-sky-700/70", muted: "text-sky-700 dark:text-sky-200" },
	lunch:     { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-800 dark:text-emerald-100", ring: "ring-emerald-300/60 dark:ring-emerald-500/40", hover: "hover:bg-emerald-200 dark:hover:bg-emerald-900/50", border: "border-emerald-300/70 dark:border-emerald-700/70", muted: "text-emerald-700 dark:text-emerald-200" },
	dinner:    { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-800 dark:text-indigo-100", ring: "ring-indigo-300/60 dark:ring-indigo-500/40", hover: "hover:bg-indigo-200 dark:hover:bg-indigo-900/50", border: "border-indigo-300/70 dark:border-indigo-700/70", muted: "text-indigo-700 dark:text-indigo-200" },
	snack:     { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-800 dark:text-amber-100", ring: "ring-amber-300/60 dark:ring-amber-500/40", hover: "hover:bg-amber-200 dark:hover:bg-amber-900/50", border: "border-amber-300/70 dark:border-amber-700/70", muted: "text-amber-700 dark:text-amber-200" },
};

// helper to aid server record search. rather than every key triggering a search, wait for a pause.
function useDebouncedValue<T>(value: T, delay = 450) {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(t);
	}, [value, delay]);
	return debounced;
}

function nameIncludes(f: Food, q: string) {
  	return f.name.toLowerCase().includes(q) || (f.brand?.toLowerCase().includes(q) ?? false);
}

// ---------- Component ----------
export default function FoodTracker() {

	// controllers
	const fc = useFoodController();
	const rc = useRecipeController();

	const [mode, setMode] = useState<Mode>("all");
	const [query, setQuery] = useState("");
	const [recentMealFilter, setRecentMealFilter] = useState<Meal>("breakfast");
	const debouncedQuery = useDebouncedValue(query, 450);
	const requestSeq = useRef(0);

	const mealId = useMemo(() => MEALS.indexOf(recentMealFilter), [recentMealFilter]);

	// Recents fetched from backend
	const [date, setDate] = useState<string>(todayLocalISO());
	const [foods, setFoods] = useState<Food[]>();
	const [loadingAll, setLoadingAll] = useState(false);
	const [copyingMeal, setCopyingMeal] = useState<Partial<Record<Meal, boolean>>>({});

	useEffect(() => {
		// run only on client
		setRecentMealFilter(mealForNow());
		setDate(todayLocalISO());
		fc.getAIRequests();
	}, []);

	// grouping food items into a meal type
	const grouped = useMemo(() => {

		const init = { breakfast: [], lunch: [], dinner: [], snack: [] } as Record<Meal, any[]>;

		for (const row of (fc.trackedFood ?? [])) {
			const mealKey = MEALS[row.meal] as Meal | undefined;
			if (!mealKey) continue;
			init[mealKey].push({ food: row, servings: Number((row as any).servings ?? 1) });
		}
		
		return init;

	}, [fc.trackedFood]);

	// fetch recents when the meal filter changes
	useEffect(() => {

		if (mode !== "recent") return;
		if (mealId < 0) return;
		fc.getRecents(mealId);

	}, [mealId]);

	// fetch tracked foods for date
	useEffect(() => {

		if (!date) return;
		fc.getFoodLog(date);

	}, [date]);

	// fetch saved recipes when recipes tab is selected
	useEffect(() => {

		if (mode !== "recipes") return;
		rc.fetchRecipes();

	}, [mode]);

    // fetch foods from search when mode is changed and query changes
    useEffect(() => {

        if (mode !== "all") return;

        const q = debouncedQuery.trim();

        if (q.length < 2) {
            setFoods([]);
            setLoadingAll(false);
            return;
        }

        const mySeq = ++requestSeq.current;

        setLoadingAll(true);

        (async () => {

            try {

				const data = await fc.onSearch(q);

                if (requestSeq.current === mySeq) 
					setFoods(data);

            } catch (err) {

                if (requestSeq.current === mySeq) {
                    console.error(err);
                    setFoods([]);
                }

            } finally {

                if (requestSeq.current === mySeq) setLoadingAll(false);

            }

        })();
        
    }, [mode, debouncedQuery]);

	// results for recent tab
	const recentFoods = useMemo(() => {
		const raw = fc.recentsByMeal?.[mealId];

		// Force it to be an array no matter what the backend/controller stored.
		const list: Food[] = Array.isArray(raw) ? raw : [];

		const q = query.toLowerCase().trim();
		return q ? list.filter((f) => nameIncludes(f, q)) : list;
	}, [fc.recentsByMeal, mealId, query]);

	// results for all tab
	const allFoods = useMemo(() => {
		console.log("foods is array?", Array.isArray(foods), foods);
		const listAll = foods ?? [];
		const q = query.toLowerCase().trim();
		return q ? listAll.filter(f => nameIncludes(f, q)) : listAll;
	}, [query, foods]);

	async function copyMeal(meal: Meal) {

		setCopyingMeal((p) => ({ ...p, [meal]: true }));

		try {

			await fc.onCopyMeal(MEALS.indexOf(meal), date);
			await fc.getFoodLog(date);

		} catch (err) {

			console.error(err);

		} finally {

			setCopyingMeal((p) => ({ ...p, [meal]: false }));
			
		}
	}

	// add a food to the users food log
	async function addFood(food: Food, meal: Meal, servings = 1) {

		try {
			await fc.onLogFood(food, MEALS.indexOf(meal), date);
		} catch (err) {
			console.log("An error has occurred", err);
		}

	}

	// Layout chrome adjustment if you have a fixed top bar
	const CHROME = 0;

	return (
		<div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
		<div
			className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:overflow-hidden"
			style={{ height: `calc(100vh - ${CHROME}px)` }}
		>
			{/* LEFT: tabbed source list (independent scroll) */}
			<div className="md:h-full md:overflow-y-auto md:pr-1">
			<div className="sticky top-0 z-10 pb-2 bg-gray-100 dark:bg-gray-900">
				<div className="flex items-center justify-between mb-2">
				<h1 className="text-2xl font-bold">Tracking</h1>
				<button
					onClick={fc.openFoodModal}
					className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
				>
					+ New Food
				</button>
				<button
					disabled={fc.remainingAIRequests == 0}
					onClick={fc.openMacroAIModal}
					className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
				>
					+ Use AI
				</button>
				</div>

				{/* Tabs */}
				<div className="flex gap-2 mb-2">
				{(["all","recent","recipes"] as Mode[]).map(t => (
					<button
					key={t}
					onClick={() => { setMode(t); setQuery(""); }}
					className={[
						"px-3 py-1.5 rounded border text-sm capitalize",
						mode === t
						? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
						: "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
					].join(" ")}
					>
					{t}
					</button>
				))}
				</div>

				{/* Search + contextual controls */}
				{mode === "recent" && (
				<div className="flex flex-wrap items-center gap-2">
					<div className="text-sm opacity-80">Showing recent for:</div>
					<div className="flex gap-2">
					{MEALS.map(m => {
						const c = mealColors[m];
						const active = recentMealFilter === m;
						return (
						<button
							key={m}
							onClick={() => setRecentMealFilter(m)}
							className={[
							"px-2 py-1 rounded text-xs capitalize border",
							active ? `${c.bg} ${c.text} ${c.border} ring-2 ${c.ring}`
									: "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
							].join(" ")}
						>
							{m}
						</button>
						);
					})}
					</div>
					<div className="flex-1" />
					<input
					className="w-full md:w-1/2 p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
					placeholder={`Search recent ${recentMealFilter}…`}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					/>
				</div>
				)}

				{mode === "all" && (
					<input
						className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
						placeholder="Search all foods…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				)}

				{mode === "recipes" && (
					<input
						className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
						placeholder="Search recipes…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				)}

			</div>

			{/* LISTS */}
			<div className="mt-2 space-y-2">
				{mode === "recent" && (
				<>
				
					{fc.loadingRecents?.[mealId] && (
					<div className="text-sm text-gray-500">Loading…</div>
					)}
					{fc.errorRecents?.[mealId] && (
					<div className="text-sm text-red-500">{fc.errorRecents[mealId]}</div>
					)}
					{!fc.loadingRecents?.[mealId] && recentFoods.length === 0 && (
					<Empty label="No recent foods found." />
					)}
					{!fc.loadingRecents?.[mealId] &&

					
					recentFoods.map(f => (
						<FoodCard
						key={f.id}
						food={f}
						onClick={() => fc.openFoodLogModal(f)}
						onQuickAdd={(meal) => addFood(f, meal, 1)}
						/>
					))}
				</>
				)}

				{mode === "all" && allFoods.map(f => (
					<FoodCard
						key={f.id}
						food={f}
						onClick={() => fc.openFoodLogModal(f)}
						onQuickAdd={(meal) => addFood(f, meal, 1)}
					/>
				))}
				{mode === "all" && allFoods.length === 0 && !loadingAll && <Empty label="No foods match your search." />}

				{mode === "recipes" && rc.loading && <div className="text-sm text-gray-500">Loading…</div>}

				{mode === "recipes" && !rc.loading && rc.recipes.length === 0 && (
					<Empty label="No saved recipes yet. Build one in the Kitchen." />
				)}

				{mode === "recipes" && !rc.loading && rc.recipes.length > 0 &&
					rc.recipes.filter(r => !query.trim() || r.name.toLowerCase().includes(query.toLowerCase().trim())).length === 0 && (
					<Empty label="No recipes match your search." />
				)}

				{mode === "recipes" && rc.recipes
					.filter(r => !query.trim() || r.name.toLowerCase().includes(query.toLowerCase().trim()))
					.map((recipe) => (
						<RecipeCard
							key={recipe.id}
							recipe={recipe}
							onClick={() => rc.openRecipeLogModal(recipe, null)}
							onQuickAdd={(meal) => addFood({
								id: null,
								name: recipe.name,
								brand: "",
								calories: Math.round(recipe.items.reduce((s, i) => s + Number(i.calories), 0)),
								protein: Math.round(recipe.items.reduce((s, i) => s + Number(i.protein), 0) * 10) / 10,
								carbs:   Math.round(recipe.items.reduce((s, i) => s + Number(i.carbs),   0) * 10) / 10,
								fat:     Math.round(recipe.items.reduce((s, i) => s + Number(i.fat),     0) * 10) / 10,
								serving_size: recipe.yield_size,
								serving_unit: recipe.yield_unit,
								is_verified: false,
							}, meal)}
						/>
					)
				)}

				<div className="h-8" />
			</div>
			</div>

			{/* RIGHT: meals log (independent scroll) */}
			<div className="md:h-full md:overflow-y-auto md:pl-1">
			<div className="flex flex-wrap items-center gap-2 mb-3">
				{/* Native calendar */}
				<input
				type="date"
				value={date}
				className="px-2 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
				placeholder="YYYY-MM-DD"
				onChange={(e) => { setDate(e.target.value); }}
				/>
				{/* Readable label */}
				<span className="text-sm opacity-70">
				{formatShortDate(date)}
				</span>
			</div>
			<div className="space-y-4">
			{MEALS.map(m => {
				const c = mealColors[m];
				const items = grouped[m];
				const totalKcal = items.reduce((s, x) => s + Number(x.food.calories) * x.servings, 0);

				return (
					<div
						key={m}
						className="rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
					>
						{/* Colored header */}
						<div className={["px-4 py-2 border-b", c.bg, c.border].join(" ")}>
						<div className="flex items-center">
							<h2 className={["flex-1 font-semibold capitalize", c.text].join(" ")}>{m}</h2>
							<span className={["text-xs tabular-nums", c.muted].join(" ")}>
								{totalKcal} kcal
							</span>
							<div className="flex-1 flex justify-end">
								<button
									type="button"
									onClick={() => copyMeal(m)}
									disabled={copyingMeal[m]}
									title="Copy from previous day"
								>
									<Copy size={14} />
								</button>
							</div>
						</div>
						</div>

						{/* Tag list */}
						<div className="p-4">
						{items.length === 0 ? (
							<div className="text-xs text-gray-500 italic">
							Tap a “+ {m}” chip on a food to add it here.
							</div>
						) : (
							<div className="flex flex-wrap gap-2">
							{items.map((x, i) => (
								<Tag
								key={`${x.food.id}-${i}`}
								label={`${x.food.name} x ${Number(x.food.serving_size)}${x.food.serving_unit}`}
								sub={`${Number(x.food.calories) * x.servings} kcal`}
								colorClasses={`${c.border} ${c.text}`}
								onRemove={() => fc.removeFoodLog(x.food.id)}
								onClick={() => fc.openEditLogModal(x.food)}
								/>
							))}
							</div>
						)}
						</div>
					</div>
				);
			})}
			</div>
			</div>
			<AddFood
				isOpen={fc.foodModalOpen}
				onClose={fc.closeFoodModal}
				onOpen={fc.openFoodModal}
				onCreate={fc.onCreate}
			/>
			<AddFoodToLog
				isOpen={fc.foodLogModalOpen}
				food={fc.selectedFoodToLog}
				logDate={date}
				onClose={fc.closeFoodLogModal}
				onLog={fc.onLogFood}
			/>
			<AddRecipeToLog
				isOpen={rc.recipeLogModalOpen}
				onClose={rc.closeRecipeLogModal}
				recipe={rc.selectedRecipeToLog}
				slot={rc.recipeLogSlot}
				logDate={date}
				onLog={fc.onLogFood}
			/>
			<EditLoggedFood
				item={fc.selectedLogToEdit}
				onClose={fc.closeEditLogModal}
				onSave={fc.onUpdateFoodLog}
			/>
			<MacroAI
				isOpen={fc.macroAIModalOpen}
				onClose={fc.closeMacroAIModal}
				onLog={fc.onLogFood}
				onDate={date}
			/>
		</div>
		</div>
	);
}

function Empty({ label }: { label: string }) {
  return <div className="text-sm text-gray-500 italic">{label}</div>;
}