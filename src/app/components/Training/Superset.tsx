"use client";

import { Link2, Unlink2 } from "lucide-react";

/**
 * Wraps a block of exercises; blocks of 2+ get the superset bracket and label.
 */
export function SupersetFrame({
	size,
	children,
	compact,
}: {
	size: number;
	children: React.ReactNode;
	compact?: boolean;
}) {

	if (size < 2) return <>{children}</>;

	return (
		<div className={`border-l-4 border-indigo-400 dark:border-indigo-500 ${compact ? "pl-2" : "pl-3"}`}>
			<p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
				Superset
			</p>
			<div className={compact ? "space-y-1" : "space-y-2"}>{children}</div>
		</div>
	);
}

/**
 * Toggle between two adjacent exercises: links them into a superset or splits them apart.
 */
export function SupersetLink({
	linked,
	onToggle,
	disabled,
}: {
	linked: boolean;
	onToggle: () => void;
	disabled?: boolean;
}) {
	return (
		<div className="flex justify-center">
			<button
				type="button"
				onClick={onToggle}
				disabled={disabled}
				aria-pressed={linked}
				title={linked ? "Split superset" : "Superset with next exercise"}
				className={[
					"inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition disabled:opacity-40",
					linked
						? "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
						: "text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/60",
				].join(" ")}
			>
				{linked ? <><Unlink2 size={14} /> Split</> : <><Link2 size={14} /> Superset</>}
			</button>
		</div>
	);
}