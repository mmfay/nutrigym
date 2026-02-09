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
  const [selectedDate, setSelectedDate] = useState<string>(todayLocalISO());
  const [saving, setSaving] = useState(false);
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setWeight(String(initialWeight ?? ""));
    setSelectedDate(todayLocalISO()); // reset to today each open (change if you want it to persist)

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

  const isValidWeight = (() => {
    const w = parseFloat(weight);
    return !Number.isNaN(w) && w > 0;
  })();

  const isValidDate = selectedDate.length === 10; // "YYYY-MM-DD"

  async function handleOk() {
    if (!isValidWeight || !isValidDate || saving) return;
    setSaving(true);

    try {
      await onConfirm({ date: selectedDate, weight: parseFloat(weight) });
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
            <p className="mt-1 text-xs text-slate-400">Log your weight.</p>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-4">
            {/* Date picker */}
			<label className="block text-sm text-center">
			<span className="text-slate-300">Date</span>

			<div className="mt-2 flex justify-center">
				<input
				type="date"
				value={selectedDate}
				onChange={(e) => setSelectedDate(e.target.value)}
				className="
					w-full max-w-[240px]
					h-11
					rounded-xl
					bg-slate-800/80 border border-slate-700
					px-3
					text-[16px] text-slate-100 text-center
					appearance-none
					focus:outline-none focus:ring-2 focus:ring-indigo-500
				"
				/>
			</div>
			</label>


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
              disabled={!isValidWeight || !isValidDate || saving}
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
