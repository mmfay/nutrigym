import { UserRecipe } from "@/lib/dataTypes";
import { mealColors, MEALS } from "@/lib/ui/mealColors";
import { Meal } from "@/lib/utils/meal";

type RecipeCardProps = {
	recipe: UserRecipe;
	onClick: () => void;
	onQuickAdd: (meal: Meal) => void;
};

export default function RecipeCard({ recipe, onClick, onQuickAdd }: RecipeCardProps) {

	const totalCals    = recipe.items.reduce((s, i) => s + Number(i.calories), 0);
	const totalProtein = recipe.items.reduce((s, i) => s + Number(i.protein),  0);
	const totalCarbs   = recipe.items.reduce((s, i) => s + Number(i.carbs),    0);
	const totalFat     = recipe.items.reduce((s, i) => s + Number(i.fat),      0);

	return (
		<button
			onClick={onClick}
			className="relative w-full text-left p-3 rounded-xl shadow transition border hover:-translate-y-0.5 hover:shadow-md bg-white/70 dark:bg-slate-900/70 backdrop-blur border-slate-200/60 dark:border-slate-700/60"
		>
			<div className="font-semibold truncate">{recipe.name}</div>

			<div className="mt-1 inline-flex flex-wrap items-center gap-2">
				<span className="px-2 py-0.5 text-[11px] rounded bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100">
					{Math.round(totalCals)} kcal / {recipe.yield_size} {recipe.yield_unit}
				</span>
				<span className="px-2 py-0.5 text-[11px] rounded bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100">
					P:{Math.round(totalProtein)} C:{Math.round(totalCarbs)} F:{Math.round(totalFat)}
				</span>
			</div>

			<div className="mt-3 flex flex-wrap gap-2">
				{MEALS.map((m) => {
					const c = mealColors[m];
					return (
						<span
							key={m}
							onClick={(e) => { e.stopPropagation(); onQuickAdd(m); }}
							className={[
								"px-2 py-1 text-xs rounded border cursor-pointer capitalize transition",
								c.bg, c.text, c.border, c.hover,
							].join(" ")}
						>
							+ {m}
						</span>
					);
				})}
			</div>
		</button>
	);
}
