"use client";

import { useEffect, useRef, useState } from "react";
import { todayLocalISO } from "../../lib/utils/date";

export type AddWeightResult = { date: string; weight: number };

export default function AddWeightModal({
	isOpen,
	onClose,
	onConfirm,
	initialWeight = "",
	}: {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (r: AddWeightResult) => void | Promise<void>;
	initialWeight?: string | number;
}) {
	const [weight, setWeight] = useState<string>(String(initialWeight ?? ""));
	const [saving, setSaving] = useState(false);
	const okRef = useRef<HTMLButtonElement>(null);

	// converted today date (from utc)
	const date = todayLocalISO();

	// runs when variables change
	useEffect(() => {

		if (!isOpen) return;

		setWeight(String(initialWeight ?? ""));

		// focus OK for quick keyboard submit
		setTimeout(() => okRef.current?.focus(), 0);

		const onKey = (e: KeyboardEvent) => {
			if (!isOpen) return;
			if (e.key === "Escape") onClose();
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "enter") {
				void handleOk();
			}
		};

		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);

	}, [isOpen, initialWeight, onClose]);

	// check if valid
	const isValid = (() => {
		const w = parseFloat(weight);
		return !Number.isNaN(w) && w > 0;
	})();

	// handle ok click
	async function handleOk() {

		if (!isValid || saving) return;
		setSaving(true);

		try {
			await onConfirm({ date, weight: parseFloat(weight) });
			onClose();
		} finally {
			setSaving(false);
		}

	}

  	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50"
			aria-modal="true"
			role="dialog"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			{/* Overlay */}
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

			{/* Centered dialog on all screens */}
			<div className="absolute inset-0 grid place-items-center p-4">
				<div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900/95 text-slate-100 shadow-2xl ring-1 ring-white/10">
				{/* Header */}
				<div className="px-6 pt-6 text-center">
					<h3 className="text-base font-semibold">Add weight entry</h3>
					<p className="mt-1 text-xs text-slate-400">
					Log today’s weight.
					</p>
				</div>

				{/* Content */}
				<div className="px-6 py-5 space-y-4">
					{/* Read-only date, centered */}
					<div className="text-center">
					<div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs text-slate-200">
						<span className="opacity-80 mr-1">Date:</span>
						<span className="font-medium">{date}</span>
					</div>
					</div>

					{/* Weight input */}
					<label className="block text-sm text-center">
					<span className="text-slate-300">Weight</span>
					<input
						inputMode="decimal"
						step="0.1"
						placeholder="e.g. 182.4"
						value={weight}
						onChange={(e) => setWeight(e.target.value)}
						className="mt-2 w-full rounded-xl bg-slate-800/80 border border-slate-700 px-3 py-2 text-slate-100 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
					</label>
				</div>

				{/* Actions */}
				<div className="px-6 pb-6 pt-2 flex items-center justify-center gap-2">
					<button
					type="button"
					onClick={onClose}
					className="rounded-xl px-4 py-2 text-sm font-medium border border-slate-600 text-slate-200 hover:bg-slate-800"
					>
					Cancel
					</button>
					<button
					ref={okRef}
					type="button"
					disabled={!isValid || saving}
					onClick={handleOk}
					className="rounded-xl px-4 py-2 text-sm font-medium text-white
								bg-gradient-to-r from-indigo-500 to-purple-500
								shadow-lg shadow-indigo-500/30 ring-1 ring-white/10
								hover:from-indigo-400 hover:to-purple-400
								disabled:opacity-60 disabled:cursor-not-allowed
								active:scale-95 transition"
					>
					{saving ? "Saving…" : "OK"}
					</button>
				</div>
				</div>
			</div>
		</div>
	);
}
