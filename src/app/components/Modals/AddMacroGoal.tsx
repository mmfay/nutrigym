import { useEffect, useMemo, useState } from "react";
import { MacroGoalCreate, MacroGoal } from "@/lib/dataTypes";
import { toNum, nonNeg } from "@/lib/services/numbers";

type GoalField = "fat" | "carbs" | "protein";
type GoalIssues = Partial<Record<GoalField, string>>;

type AddMacroGoalProps = {
	isOpen: boolean;
	onClose: () => void;
	onCreate: (goal: MacroGoalCreate) => Promise<MacroGoal>;
};

export default function AddMacroGoal({ isOpen, onClose, onCreate }: AddMacroGoalProps) {

	// states
	const [touched, setTouched] = useState<Record<string, boolean>>({});

	// calories is now derived (we keep it as number for submit)
	const [fat, setFat] = useState("");
	const [carbs, setCarbs] = useState("");
	const [protein, setProtein] = useState("");

	const inputBase =
		"w-full rounded-lg border px-3 py-2 text-base " +
		"bg-white dark:bg-slate-900/60 " +
		"text-slate-900 dark:text-slate-100 placeholder:text-slate-400 " +
		"border-slate-300 dark:border-slate-700 " +
		"focus:outline-none focus:ring-2 focus:ring-indigo-500";

	const labelBase = "block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1";
	const errText = "mt-1 text-xs text-red-600";

	// numbers (treat blank as 0 for calculation; validation handled below)
	const fNum = useMemo(() => Math.max(0, toNum(fat) || 0), [fat]);
	const cNum = useMemo(() => Math.max(0, toNum(carbs) || 0), [carbs]);
	const pNum = useMemo(() => Math.max(0, toNum(protein) || 0), [protein]);

	// 9 kcal/g fat, 4 kcal/g carbs, 4 kcal/g protein
	const caloriesNum = useMemo(() => Math.round(fNum * 9 + cNum * 4 + pNum * 4), [fNum, cNum, pNum]);

	const caloriesDisplay = useMemo(
		() => (Number.isFinite(caloriesNum) ? String(caloriesNum) : ""),
		[caloriesNum]
	);

	// submission of the new item
	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		// mark all touched so errors show
		setTouched((t) => ({ ...t, fat: true, carbs: true, protein: true }));

		const hasIssues = Object.keys(issues).length > 0;
		if (hasIssues) return;

		// build payload (adjust shape/fields to whatever your API expects)
		const payload = {
		calories: caloriesNum,
		fat: fNum,
		carbs: cNum,
		protein: pNum,
		} as MacroGoalCreate;

		const goal = onCreate(payload);
		onClose();
	}

	const issues: GoalIssues = useMemo(() => {
		const f = toNum(fat);
		const c = toNum(carbs);
		const p = toNum(protein);

		const errors: GoalIssues = {};

		// optional: only validate once user has typed something
		// (otherwise blank might show as invalid depending on toNum/nonNeg)
		const hasFat = fat.trim() !== "";
		const hasCarbs = carbs.trim() !== "";
		const hasProtein = protein.trim() !== "";

		if (hasFat && !nonNeg(f)) errors.fat = "Fat must be 0 or more.";
		if (hasCarbs && !nonNeg(c)) errors.carbs = "Carbs must be 0 or more.";
		if (hasProtein && !nonNeg(p)) errors.protein = "Protein must be 0 or more.";

		return errors;
	}, [fat, carbs, protein]);

	// optional: reset fields each time the modal opens
	useEffect(() => {
		if (!isOpen) return;
		setTouched({});
		setFat("");
		setCarbs("");
		setProtein("");
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4">
		<div className="w-full max-w-lg rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/90 shadow-xl overflow-hidden">
			{/* Header */}
			<div className="px-6 pt-5 pb-4 border-b border-slate-200/60 dark:border-slate-700/60">
			<div className="flex items-start justify-between gap-3">
				<div>
				<h4 className="text-base font-semibold text-slate-900 dark:text-white">Set Macro Goals</h4>
				</div>
			</div>
			</div>

			{/* Body */}
			<form onSubmit={handleSubmit} className="px-6 py-5 max-h-[75vh] overflow-y-auto">
			<div className="space-y-4">
				{/* BASIC */}
				<div className="space-y-4">
				{/* Calories (calculated, read-only) */}
				<div>
					<label className={labelBase} htmlFor="calories">
					Calories (calculated)
					</label>
					<input
					id="calories"
					type="number"
					className={inputBase + " opacity-80"}
					value={caloriesDisplay}
					readOnly
					disabled
					/>
					<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
					Calories = (Protein × 4) + (Carbs × 4) + (Fat × 9)
					</p>
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
						placeholder="e.g., 50"
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
						placeholder="e.g., 200"
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
						placeholder="e.g., 180"
					/>
					{touched.protein && issues.protein && <p className={errText}>{issues.protein}</p>}
					</div>
				</div>
				</div>

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
					Save Goals
				</button>
				</div>
			</div>
			</form>
		</div>
		</div>
	);
}