"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, LineChart as LineChartIcon, Trash2, X } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ExerciseProgressPoint, TrackingType, WorkoutSession } from "@/lib/dataTypes";
import { WorkoutController } from "@/lib/hooks/useWorkoutController";
import { formatShortDate } from "@/lib/utils/date";
import { formatDuration, formatSet, groupSupersets } from "@/lib/utils/workout";
import { btnDanger, btnSecondary, card, errorBox, muted } from "./ui";

type Metric = {
	key: keyof Omit<ExerciseProgressPoint, "date">;
	label: string;
	format: (v: number) => string;
};

const lb = (v: number) => `${Math.round(v).toLocaleString()} lb`;

const METRICS: Record<TrackingType, Metric[]> = {
	WEIGHT_REPS: [
		{ key: "est_1rm", label: "Est. 1RM", format: lb },
		{ key: "top_weight", label: "Top set", format: lb },
		{ key: "volume", label: "Volume", format: lb },
	],
	REPS: [{ key: "total_reps", label: "Total reps", format: (v) => `${v} reps` }],
	TIME: [{ key: "total_duration_seconds", label: "Total time", format: formatDuration }],
	DISTANCE_TIME: [
		{ key: "total_distance", label: "Distance", format: (v) => `${v} mi` },
		{ key: "total_duration_seconds", label: "Time", format: formatDuration },
	],
};

function durationBetween(start: string, end: string | null) {
	if (!end) return null;
	return (new Date(end).getTime() - new Date(start).getTime()) / 1000;
}

export default function WorkoutHistory({
	wc,
	onPickProgressExercise,
}: {
	wc: WorkoutController;
	onPickProgressExercise: () => void;
}) {

	return (
		<div className="space-y-6">
			{wc.error && <div className={errorBox}>{wc.error}</div>}

			<ProgressChart wc={wc} onPick={onPickProgressExercise} />

			<section className="space-y-3">
				<h2 className="text-sm font-semibold text-slate-900 dark:text-white">Past workouts</h2>

				{wc.history.length === 0 && wc.loadingHistory ? (
					<p className={muted}>Loading…</p>
				) : wc.history.length === 0 ? (
					<div className={`${card} px-6 py-8 text-center`}>
						<p className={muted}>Finished workouts show up here.</p>
					</div>
				) : (
					<ul className={`${card} divide-y divide-slate-200/60 dark:divide-slate-700/60 overflow-hidden`}>
						{wc.history.map((s) => {
							const dur = durationBetween(s.started_at, s.ended_at);
							return (
								<li key={s.id}>
									<button
										type="button"
										onClick={() => wc.openSession(s.id)}
										className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-4 text-left hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
									>
										<div className="min-w-0">
											<div className="flex items-baseline gap-2">
												<span className="font-medium text-slate-900 dark:text-white truncate">{s.name}</span>
												<span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
													{formatShortDate(new Date(s.started_at))}
												</span>
											</div>
											<p className="text-xs text-slate-500 dark:text-slate-400 truncate">
												{s.exercise_names.join(", ") || "No exercises"}
											</p>
											<p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
												{dur !== null && <>{formatDuration(dur)} · </>}
												{s.set_count} sets
												{s.volume > 0 && <> · {lb(s.volume)}</>}
											</p>
										</div>
										<ChevronRight size={18} className="shrink-0 text-slate-400" />
									</button>
								</li>
							);
						})}
					</ul>
				)}

				{wc.hasMoreHistory && (
					<div className="text-center">
						<button type="button" onClick={wc.loadMoreHistory} disabled={wc.loadingHistory} className={btnSecondary}>
							{wc.loadingHistory ? "Loading…" : "Load more"}
						</button>
					</div>
				)}
			</section>

			{wc.selectedSession && (
				<SessionDetail
					session={wc.selectedSession}
					onClose={wc.closeSession}
					onDelete={async (id) => {
						if (confirm("Delete this workout permanently?")) await wc.deleteSession(id);
					}}
				/>
			)}
		</div>
	);
}

function ProgressChart({ wc, onPick }: { wc: WorkoutController; onPick: () => void }) {

	const exercise = wc.progressExercise;
	const metrics = exercise ? METRICS[exercise.tracking_type] : [];
	const [metricKey, setMetricKey] = useState<Metric["key"] | null>(null);

	// default to the first metric whenever the exercise changes
	useEffect(() => {
		setMetricKey(exercise ? METRICS[exercise.tracking_type][0].key : null);
	}, [exercise?.id]);

	const metric = metrics.find((m) => m.key === metricKey) ?? metrics[0];

	const data = useMemo(() => {
		if (!metric || !wc.progress) return [];
		return wc.progress.progress
			.filter((p) => p[metric.key] !== null)
			.map((p) => ({ date: formatShortDate(p.date), value: Number(p[metric.key]) }));
	}, [wc.progress, metric]);

	return (
		<section className={`${card} p-4 sm:p-6`}>
			<div className="flex flex-wrap items-center justify-between gap-3 mb-4">
				<div className="min-w-0">
					<h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
						{exercise ? `${exercise.name}${metric ? ` · ${metric.label}` : ""}` : "Exercise progress"}
					</h2>
					{exercise && wc.progress?.last && (
						<p className="text-xs text-slate-500 dark:text-slate-400">
							Last: {wc.progress.last.sets.filter((s) => !s.is_warmup).map((s) => formatSet(s, exercise.tracking_type)).join(", ")}
						</p>
					)}
				</div>
				<button type="button" onClick={onPick} className={`${btnSecondary} inline-flex items-center gap-2 py-1.5`}>
					<LineChartIcon size={16} /> {exercise ? "Change exercise" : "Pick exercise"}
				</button>
			</div>

			{/* metric filter, one row above the chart */}
			{metrics.length > 1 && (
				<div className="mb-3 inline-flex rounded-xl border border-slate-200 dark:border-slate-700 p-0.5">
					{metrics.map((m) => (
						<button
							key={m.key}
							type="button"
							onClick={() => setMetricKey(m.key)}
							aria-pressed={metric?.key === m.key}
							className={[
								"rounded-lg px-3 py-1 text-xs font-medium transition",
								metric?.key === m.key
									? "bg-indigo-500 text-white"
									: "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
							].join(" ")}
						>
							{m.label}
						</button>
					))}
				</div>
			)}

			{!exercise ? (
				<p className={`${muted} py-8 text-center`}>Pick an exercise to see how it&apos;s trending.</p>
			) : wc.loadingProgress ? (
				<p className={`${muted} py-8 text-center`}>Loading…</p>
			) : data.length === 0 ? (
				<p className={`${muted} py-8 text-center`}>No finished workouts with this exercise yet.</p>
			) : (
				<div className="h-64">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={data} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
							<CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
							<XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} minTickGap={16} />
							<YAxis
								tick={{ fontSize: 12 }}
								tickLine={false}
								axisLine={false}
								width={56}
								domain={["auto", "auto"]}
								tickFormatter={(v: number) => (metric.key === "total_duration_seconds" ? formatDuration(v) : Math.round(v).toLocaleString())}
							/>
							<Tooltip
								formatter={(v) => [metric.format(Number(v)), metric.label]}
								contentStyle={{ borderRadius: 12, fontSize: 12 }}
							/>
							<Line
								type="monotone"
								dataKey="value"
								stroke="#6366f1"
								strokeWidth={2}
								dot={data.length <= 30 ? { r: 4, strokeWidth: 2 } : false}
								activeDot={{ r: 5 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			)}
		</section>
	);
}

export function SessionDetail({
	session,
	onClose,
	onDelete,
}: {
	session: WorkoutSession;
	onClose: () => void;
	onDelete: (id: number) => void;
}) {

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const dur = durationBetween(session.started_at, session.ended_at);

	return (
		<div
			className="fixed inset-0 z-50"
			aria-modal="true"
			role="dialog"
		>
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
			<div
				className="absolute inset-0 grid place-items-end sm:place-items-center p-safe-4"
				onClick={(e) => e.target === e.currentTarget && onClose()}
			>
				<div className="w-full min-w-0 max-w-lg max-h-[85dvh] flex flex-col rounded-2xl border border-slate-700/60 bg-slate-900/95 text-slate-100 shadow-2xl ring-1 ring-white/10">
					<div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
						<div className="min-w-0">
							<h3 className="text-base font-semibold truncate">{session.name}</h3>
							<p className="text-xs text-slate-400">
								{new Date(session.started_at).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
								{dur !== null && <> · {formatDuration(dur)}</>}
							</p>
						</div>
						<button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800">
							<X size={18} />
						</button>
					</div>

					<div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
						{session.notes && <p className="text-sm text-slate-300 italic">{session.notes}</p>}

						{groupSupersets(session.exercises).map((group) => (
							<div
								key={group[0].id}
								className={group.length > 1 ? "border-l-4 border-indigo-500 pl-3 space-y-3" : "space-y-3"}
							>
								{group.length > 1 && (
									<p className="-mb-2 text-[11px] font-semibold uppercase tracking-wide text-indigo-400">Superset</p>
								)}
								{group.map((ex) => (
									<div key={ex.id}>
										<p className="text-sm font-medium">{ex.exercise_name}</p>
										{ex.sets.length === 0 ? (
											<p className="text-xs text-slate-500">No sets logged</p>
										) : (
											<ol className="mt-1 space-y-0.5">
												{ex.sets.map((s) => (
													<li key={s.id} className="flex gap-3 text-sm tabular-nums">
														<span className="w-5 text-right text-xs text-slate-500 pt-0.5">{s.is_warmup ? "W" : s.set_number}</span>
														<span className={s.is_warmup ? "text-slate-400" : ""}>{formatSet(s, ex.tracking_type)}</span>
													</li>
												))}
											</ol>
										)}
									</div>
								))}
							</div>
						))}
					</div>

					<div className="border-t border-slate-800 px-5 py-3 flex justify-end">
						<button type="button" onClick={() => onDelete(session.id)} className={`${btnDanger} inline-flex items-center gap-2`}>
							<Trash2 size={16} /> Delete workout
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}