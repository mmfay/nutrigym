"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
	ResponsiveContainer,
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	BarChart,
	Bar,
	Legend,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import { fetchWeightTrend } from "@/lib/api/weight/weight";
import { WeightPoint, DayMacros, TodayMacros, MacroGoal } from "@/lib/dataTypes";
import { fetchDailyMacros, fetchMacroTrend, fetchDailyMacroGoals } from "@/lib/api/macros/macros";
import { fetchHomePagePayload } from "@/lib/api/payloads/home";
import { DEFAULT_GOAL, DEFAULT_TODAY } from "@/lib/dataTypes";

export default function HomePage() {

	// In real app, fetch these from your API on mount
	const [loading, setLoading] = useState(true);
	const [goal, setGoal] = useState<MacroGoal>(DEFAULT_GOAL);
	const [today, setToday] = useState<TodayMacros>(DEFAULT_TODAY);
	const [week, setWeek] = useState<DayMacros[]>([]);
	const [weight, setWeight] = useState<WeightPoint[]>([]);

	// simulate api
	useEffect(() => {
		
		let isMounted = true;
		async function loadTrend() {
			try {
				const HomePage = await fetchHomePagePayload();
				setWeight(HomePage.weight);
				setWeek(HomePage.macros);
				setToday(HomePage.today);
				setGoal(HomePage.goals);
			} catch (err) {
				console.error(err);
			} finally {
				if (isMounted) setLoading(false);
			}
		}

    	loadTrend();
		const t = setTimeout(() => {

			setLoading(false);

		}, 600);

		return () => clearTimeout(t);

	}, []);

	// Progress calculations
	const proteinPct = Math.min(100, Math.round((today.protein / goal.protein) * 100));
	const carbsPct = Math.min(100, Math.round((today.carbs / goal.carbs) * 100));
	const fatPct = Math.min(100, Math.round((today.fat / goal.fat) * 100));
	const calsPct = Math.min(100, Math.round((today.calories / goal.calories) * 100));

	const donutData = useMemo(
		() => [
			{ 	
				name: "Protein", 
				value: today.protein, 
				goal: goal.protein 
			},
			{ 	
				name: "Carbs", 
				value: today.carbs, 
				goal: goal.carbs 
			},
			{ 
				name: "Fat",
				value: today.fat, 
				goal: goal.fat 
			},
		],
		[today, goal]
	);

  	const donutColors = ["#0ea5e9", "#22c55e", "#f59e0b"]; // sky, green, amber

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
		{/* Top bar */}
		<header className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur bg-white/60 dark:bg-slate-900/60 sticky top-0 z-30">
			<div className="mx-auto max-w-7xl flex items-center justify-between">
			<div className="flex items-center gap-4">
				<span className="font-semibold tracking-tight text-slate-900 dark:text-white">NutriGym</span>
				<span className="text-xs text-slate-500 dark:text-slate-400">Home</span>
			</div>
			<div className="flex items-center gap-3">
				<Link href="/foods" className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60">Foods</Link>
				<Link href="/meals" className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60">Meals</Link>
				<Link href="/profile" className="rounded-xl bg-slate-900 text-white px-3 py-1.5 text-sm font-medium shadow hover:opacity-95">Profile</Link>
			</div>
			</div>
		</header>

		<main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
			{/* Greeting + quick add */}
			<section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
			<div className="lg:col-span-3 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur p-6">
				<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Good to see you</h1>
					<p className="text-sm text-slate-600 dark:text-slate-300">Stay consistent. Log the next meal in under a minute.</p>
				</div>
				<div className="flex gap-2">
					<Link href="/foods" className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-medium shadow hover:opacity-95">Quick add food</Link>
					<Link href="/meals" className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60">Saved meals</Link>
				</div>
				</div>
			</div>

			{/* Today ring summary */}
			<div className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur p-6">
				<div className="text-sm font-medium text-slate-900 dark:text-white">Today</div>
				<div className="mt-4 grid grid-cols-2 gap-3 text-sm">
				<div className="space-y-1">
					<div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Calories</span><span>{today.calories}/{goal.calories}</span></div>
					<div className="h-2 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden"><div className="h-2 bg-slate-900 dark:bg-white" style={{ width: `${calsPct}%` }} /></div>
				</div>
				<div className="space-y-1">
					<div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Protein</span><span>{today.protein}/{goal.protein}g</span></div>
					<div className="h-2 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden"><div className="h-2 bg-sky-500" style={{ width: `${proteinPct}%` }} /></div>
				</div>
				<div className="space-y-1">
					<div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Carbs</span><span>{today.carbs}/{goal.carbs}g</span></div>
					<div className="h-2 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden"><div className="h-2 bg-emerald-500" style={{ width: `${carbsPct}%` }} /></div>
				</div>
				<div className="space-y-1">
					<div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Fat</span><span>{today.fat}/{goal.fat}g</span></div>
					<div className="h-2 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden"><div className="h-2 bg-amber-500" style={{ width: `${fatPct}%` }} /></div>
				</div>
				</div>
			</div>
			</section>

			{/* Charts row 1: Donut + Weekly Macros */}
			<section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
			{/* Donut breakdown */}
			<div className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur p-6">
				<div className="flex items-center justify-between mb-4">
				<h2 className="text-sm font-semibold text-slate-900 dark:text-white">Today’s macro breakdown</h2>
				<div className="text-xs text-slate-500 dark:text-slate-400">vs goal</div>
				</div>
				<div className="h-64">
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
					<Pie data={donutData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
						{donutData.map((entry, idx) => (
						<Cell key={`c-${idx}`} fill={donutColors[idx % donutColors.length]} />
						))}
					</Pie>
					<Tooltip formatter={(value: any, name: any, _payload: any, index: number) => [`${value}g`, name]} />
					</PieChart>
				</ResponsiveContainer>
				</div>
				<div className="mt-4 grid grid-cols-3 gap-3 text-xs">
				{donutData.map((d, i) => (
					<div key={d.name} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
					<div className="flex items-center justify-between">
						<span className="text-slate-600 dark:text-slate-300">{d.name}</span>
						<span className="font-medium text-slate-900 dark:text-white">{Math.round((d.value / (d.goal || 1)) * 100)}%</span>
					</div>
					<div className="mt-2 h-2 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden">
						<div className="h-2" style={{ width: `${Math.min(100, (d.value / (d.goal || 1)) * 100)}%`, backgroundColor: donutColors[i] }} />
					</div>
					</div>
				))}
				</div>
			</div>

			{/* Weekly macros stacked bars */}
			<div className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur p-6">
				<div className="flex items-center justify-between mb-4">
				<h2 className="text-sm font-semibold text-slate-900 dark:text-white">Last 7 days (g)</h2>
				<div className="text-xs text-slate-500 dark:text-slate-400">Protein / Carbs / Fat</div>
				</div>
				<div className="h-64">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={week} stackOffset="none">
					<CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
					<XAxis dataKey="date" tick={{ fontSize: 12 }} />
					<YAxis tick={{ fontSize: 12 }} />
					<Tooltip />
					<Legend />
					<Bar dataKey="protein" stackId="a" fill="#0ea5e9" />
					<Bar dataKey="carbs" stackId="a" fill="#22c55e" />
					<Bar dataKey="fat" stackId="a" fill="#f59e0b" />
					</BarChart>
				</ResponsiveContainer>
				</div>
			</div>
			</section>

			{/* Charts row 2: Weight trend */}
			<section className="grid grid-cols-1 gap-6">
			<div className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur p-6">
				<div className="flex items-center justify-between mb-4">
				<h2 className="text-sm font-semibold text-slate-900 dark:text-white">Weight trend (last 4 weeks)</h2>
				<div className="text-xs text-slate-500 dark:text-slate-400">Target rate: −0.5 lb/week</div>
				</div>
				<div className="h-72">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart data={weight} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
					<CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
					<XAxis dataKey="date" tick={{ fontSize: 12 }} />
					<YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
					<Tooltip />
					<Line type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={3} dot={false} />
					</LineChart>
				</ResponsiveContainer>
				</div>
			</div>
			</section>

			{/* Placeholder for recent meals */}
			<section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div className="lg:col-span-2 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur p-6">
				<h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Recent meals</h2>
				<div className="text-sm text-slate-600 dark:text-slate-300">Coming soon — your last 10 items for one‑tap re‑log.</div>
			</div>
			<div className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur p-6">
				<h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Tips</h2>
				<ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
				<li>Use saved meals for dishes you eat weekly.</li>
				<li>Log right after eating to keep your streak.</li>
				<li>Adjust macro goals as your weight changes.</li>
				</ul>
			</div>
			</section>
		</main>

		{/* Footer */}
		<footer className="px-6 py-8 text-center text-xs text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} NutriGym. All rights reserved.</footer>

		{/* Loading overlay */}
		{loading && (
			<div className="fixed inset-0 grid place-items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm z-50">
			<div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 px-5 py-3 text-sm text-slate-700 dark:text-slate-200 shadow">Loading your dashboard…</div>
			</div>
		)}
		</div>
	);
}
