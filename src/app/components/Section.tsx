type SectionProps = {
	title: string;
	subtitle?: string;
	open: boolean;
	onToggle: () => void;
	children: React.ReactNode;
}

export function Section({
	title,
	subtitle,
	open,
	onToggle,
	children
} : SectionProps) {
	return (
		<div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
		<button
			type="button"
			onClick={onToggle}
			className="w-full px-4 py-3 flex items-start justify-between gap-3
					bg-white/40 dark:bg-slate-900/40 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
		>
			<div className="text-left">
			<div className="text-sm font-medium text-slate-900 dark:text-white">
				{title}
			</div>
			{subtitle && (
				<div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
				{subtitle}
				</div>
			)}
			</div>

			<div
			className={`mt-0.5 text-slate-500 dark:text-slate-400 transition-transform ${
				open ? "rotate-180" : ""
			}`}
			aria-hidden
			>
			▾
			</div>
		</button>

		{open && <div className="px-4 py-4">{children}</div>}
		</div>
	);
}