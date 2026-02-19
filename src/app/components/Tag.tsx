type TagProps = {
	label: string;
	sub?: string;
	onRemove: () => void;
	colorClasses?: string; // allows meal color tinting
}
export default function Tag({
	label, sub, onRemove, colorClasses
}: TagProps) {
	return (
		<span
			className={[
				"inline-flex items-center gap-2 max-w-full",
				"px-2 py-1 rounded-full text-xs border",
				"bg-gray-50 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
				colorClasses ?? ""
			].join(" ")}
			title={sub ? `${label} — ${sub}` : label}
		>
			<span className="truncate">{label}</span>
			{sub && <span className="opacity-70">· {sub}</span>}
			<button
				type="button"
				aria-label={`Remove ${label}`}
				onClick={onRemove}
				className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"
			>
				×
			</button>
		</span>
	);
}