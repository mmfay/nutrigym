import type { Metadata } from "next";
import Link from "next/link";
import {
	Bell,
	Braces,
	CalendarDays,
	Camera,
	ChefHat,
	Dumbbell,
	KeyRound,
	Layers,
	LineChart,
	ScanBarcode,
	Search,
	Smartphone,
	Target,
	Utensils,
} from "lucide-react";

export const metadata: Metadata = {
	title: "NutriGym | Nutrition and training in one place",
	description:
		"Log meals with search, barcode scanning and AI photo estimates. Plan workouts with templates, supersets and a calendar. Reminders keep you on track.",
	openGraph: {
		title: "NutriGym",
		description: "Log meals. Plan workouts. Track both in one place.",
		type: "website",
	},
};

const btnPrimary =
	"inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3 font-medium text-white " +
	"shadow-lg shadow-indigo-500/30 ring-1 ring-white/10 hover:from-indigo-400 hover:to-purple-400 active:scale-[0.98] transition";

const btnSecondary =
	"inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-3 font-medium " +
	"text-slate-800 dark:text-slate-100 hover:bg-white/70 dark:hover:bg-slate-800/60 transition";

const card =
	"rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur";

const PILLARS = [
	{
		name: "Nutrition",
		icon: Utensils,
		accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50",
		blurb: "Log a meal in seconds and see exactly what's left for the day.",
		features: [
			{ icon: Search, title: "Search and recents", body: "Find foods fast, re-log recent ones, or copy yesterday's meal." },
			{ icon: ScanBarcode, title: "Barcode scanning", body: "Point your phone's camera at a package to log it." },
			{ icon: Camera, title: "AI photo estimates", body: "Snap a meal and get a macro estimate, up to 3 times a day." },
			{ icon: ChefHat, title: "Recipes and goals", body: "Save recipes you make often and set calorie and macro targets." },
		],
	},
	{
		name: "Training",
		icon: Dumbbell,
		accent: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50",
		blurb: "Plan the week, log every set, and watch your lifts climb.",
		features: [
			{ icon: Layers, title: "Templates and supersets", body: "Build workouts once, link exercises into supersets, start in one tap." },
			{ icon: CalendarDays, title: "Workout calendar", body: "Plan sessions on days ahead and see what's done, planned or missed." },
			{ icon: Dumbbell, title: "Fast set logging", body: "Last time's numbers are pre-filled, so most sets are a single tap." },
			{ icon: LineChart, title: "Progress per exercise", body: "Top weight, volume and estimated one-rep max over time." },
		],
	},
];

const STEPS = [
	{ icon: Target, title: "Set your goals", body: "Choose calorie and macro targets, and plan this week's workouts." },
	{ icon: Utensils, title: "Log and train", body: "Log meals as you eat and sets as you lift, right from your phone." },
	{ icon: Bell, title: "Stay on track", body: "Reminders and check-ins tell you what's left before the day gets away." },
];

export default function LandingPage() {
	return (
		<div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">

			{/* Hero */}
			<section className="relative">
				<div className="pointer-events-none absolute inset-x-0 -top-24 h-96 bg-gradient-to-b from-indigo-200/40 via-purple-100/20 to-transparent dark:from-indigo-900/30 dark:via-purple-900/10" aria-hidden />
				<div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-12 lg:pt-20 lg:pb-20">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						<div className="space-y-6">
							<span className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 backdrop-blur">
								<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Nutrition
								<span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Training
								<span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> One app
							</span>
							<h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
								Log meals. Plan workouts.{" "}
								<span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
									Track both in one place.
								</span>
							</h1>
							<p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl">
								NutriGym puts barcode scanning, AI photo estimates and macro goals next to workout templates,
								supersets and a training calendar, with reminders that keep the day on track.
							</p>
							<div className="flex flex-col sm:flex-row gap-3">
								<Link href="/signup" className={btnPrimary}>Create your free account</Link>
								<Link href="/login" className={btnSecondary}>Log in</Link>
							</div>
						</div>

						<AppPreviews />
					</div>
				</div>
			</section>

			{/* Nutrition + Training */}
			<section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 py-12 lg:py-16">
				<div className="max-w-2xl mb-10">
					<h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Two halves of the same goal</h2>
					<p className="mt-3 text-slate-600 dark:text-slate-300">
						What you eat and how you train work together, so they live in the same app.
					</p>
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{PILLARS.map((p) => (
						<div key={p.name} className={`${card} p-6 sm:p-8`}>
							<div className="flex items-center gap-3">
								<span className={`grid h-10 w-10 place-items-center rounded-xl ${p.accent}`}>
									<p.icon size={20} />
								</span>
								<h3 className="text-xl font-semibold text-slate-900 dark:text-white">{p.name}</h3>
							</div>
							<p className="mt-3 text-slate-600 dark:text-slate-300">{p.blurb}</p>
							<ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
								{p.features.map((f) => (
									<li key={f.title} className="flex gap-3">
										<f.icon size={18} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
										<div>
											<p className="text-sm font-semibold text-slate-900 dark:text-white">{f.title}</p>
											<p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.body}</p>
										</div>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</section>

			{/* Phone + API */}
			<section className="mx-auto max-w-7xl px-4 sm:px-6 pb-12 lg:pb-16">
				<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
					<div className={`${card} lg:col-span-3 p-6 sm:p-8`}>
						<div className="flex items-center gap-3">
							<span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
								<Smartphone size={20} />
							</span>
							<h3 className="text-xl font-semibold text-slate-900 dark:text-white">Built for your phone</h3>
						</div>
						<p className="mt-3 text-slate-600 dark:text-slate-300">
							Add NutriGym to your Home Screen and it opens like an app, no app store needed.
						</p>
						<ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
							<li className="flex gap-3">
								<Bell size={18} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
								<div>
									<p className="text-sm font-semibold text-slate-900 dark:text-white">Workout reminders</p>
									<p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
										A reminder at the time you choose, and a badge on the app icon until the workout is done.
									</p>
								</div>
							</li>
							<li className="flex gap-3">
								<Utensils size={18} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
								<div>
									<p className="text-sm font-semibold text-slate-900 dark:text-white">After-meal check-ins</p>
									<p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
										After breakfast, lunch or dinner, see how much of each macro you&apos;ve logged and what&apos;s left.
									</p>
								</div>
							</li>
						</ul>
					</div>

					<div className={`${card} lg:col-span-2 p-6 sm:p-8 flex flex-col`}>
						<div className="flex items-center gap-3">
							<span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
								<Braces size={20} />
							</span>
							<h3 className="text-xl font-semibold text-slate-900 dark:text-white">Your data, your API</h3>
						</div>
						<p className="mt-3 text-slate-600 dark:text-slate-300">
							Generate a personal API key and pull your macros, weight and workouts into your own spreadsheets,
							dashboards or scripts.
						</p>
						<pre className="mt-5 overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 text-xs leading-relaxed text-slate-100 dark:bg-slate-950">
							<code>
								<span className="text-slate-400">$</span> curl /api/v1/workouts?days=7 \{"\n"}
								{"    "}-H <span className="text-emerald-300">&quot;Authorization: Bearer &lt;key&gt;&quot;</span>
							</code>
						</pre>
						<Link href="/api-docs" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
							<KeyRound size={16} /> Read the API docs
						</Link>
					</div>
				</div>
			</section>

			{/* How it works */}
			<section id="how" className="mx-auto max-w-7xl px-4 sm:px-6 pb-12 lg:pb-16">
				<div className={`${card} p-6 sm:p-8`}>
					<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">How it works</h2>
					<ol className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
						{STEPS.map((s, i) => (
							<li key={s.title} className="flex items-start gap-4">
								<span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">
									<s.icon size={18} />
									<span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-[10px] font-semibold text-white">
										{i + 1}
									</span>
								</span>
								<div>
									<h3 className="text-sm font-semibold text-slate-900 dark:text-white">{s.title}</h3>
									<p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{s.body}</p>
								</div>
							</li>
						))}
					</ol>
				</div>
			</section>

			{/* CTA */}
			<section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
				<div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-purple-950">
					<div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" aria-hidden />
					<div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden />
					<div className="relative p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
						<div>
							<h2 className="text-2xl md:text-3xl font-semibold text-white">Start your streak today</h2>
							<p className="mt-2 text-slate-200 text-sm md:text-base max-w-md">
								Create an account, set your goals, and log your first meal or workout in under a minute.
							</p>
						</div>
						<div className="flex flex-col sm:flex-row md:justify-end gap-3">
							<Link href="/signup" className="inline-flex items-center justify-center rounded-xl bg-white text-slate-900 px-5 py-3 font-medium shadow hover:opacity-95 active:opacity-90">
								Create account
							</Link>
							<Link href="/login" className="inline-flex items-center justify-center rounded-xl border border-white/60 text-white px-5 py-3 font-medium hover:bg-white/10">
								Log in
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer id="contact" className="border-t border-slate-200/60 dark:border-slate-800/60">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
					<div>
						<div className="font-semibold text-slate-900 dark:text-white">NutriGym</div>
						<p className="mt-2 text-slate-600 dark:text-slate-300">Nutrition and training in one place, without the clutter.</p>
					</div>
					<div className="text-slate-600 dark:text-slate-300">
						<div className="font-medium text-slate-900 dark:text-white">Product</div>
						<ul className="mt-2 space-y-2">
							<li><a href="#features" className="hover:underline">Features</a></li>
							<li><a href="#how" className="hover:underline">How it works</a></li>
							<li><Link href="/api-docs" className="hover:underline">API</Link></li>
							<li><Link href="/privacy" className="hover:underline">Privacy</Link></li>
							<li><Link href="/terms" className="hover:underline">Terms</Link></li>
						</ul>
					</div>
					<div className="text-slate-600 dark:text-slate-300">
						<div className="font-medium text-slate-900 dark:text-white">Get started</div>
						<ul className="mt-2 space-y-2">
							<li><Link href="/signup" className="hover:underline">Create account</Link></li>
							<li><Link href="/login" className="hover:underline">Log in</Link></li>
						</ul>
					</div>
				</div>
				<div className="px-6 pb-8 text-center text-xs text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} NutriGym. All rights reserved.</div>
			</footer>
		</div>
	);
}

/**
 * Two drawn phone screens (Tracking + an active workout) standing in for screenshots.
 */
function AppPreviews() {
	return (
		<div className="relative mx-auto w-full max-w-md lg:max-w-lg">
			<p className="sr-only">
				Preview: the Tracking screen shows calories left and progress on protein, carbs and fat. The workout screen shows a
				superset of bench press and rows with logged sets.
			</p>
			<div className="flex items-start justify-center gap-3 sm:gap-5" aria-hidden>
				<Phone className="mt-10">
					<TrackingScreen />
				</Phone>
				<Phone>
					<WorkoutScreen />
				</Phone>
			</div>
		</div>
	);
}

function Phone({ children, className = "" }: { children: React.ReactNode; className?: string }) {
	return (
		<div className={`w-[48%] max-w-[230px] rounded-[2rem] border border-slate-300 dark:border-slate-700 bg-slate-900 p-1.5 shadow-2xl shadow-indigo-500/20 ${className}`}>
			<div className="overflow-hidden rounded-[1.6rem] bg-slate-50 dark:bg-slate-950">
				<div className="mx-auto mt-1.5 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-800" />
				<div className="p-3 space-y-2.5">{children}</div>
			</div>
		</div>
	);
}

function MacroBar({ label, pct, color, note }: { label: string; pct: number; color: string; note: string }) {
	return (
		<div>
			<div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
				<span>{label}</span>
				<span>{note}</span>
			</div>
			<div className="mt-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
				<div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
			</div>
		</div>
	);
}

function TrackingScreen() {
	const pct = 61;
	const r = 34;
	const c = 2 * Math.PI * r;
	return (
		<>
			<p className="text-[11px] font-semibold text-slate-900 dark:text-white">Today</p>
			<div className="rounded-2xl bg-white dark:bg-slate-900 p-3 shadow-sm">
				<div className="relative mx-auto h-20 w-20">
					<svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
						<circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-slate-200 dark:stroke-slate-800" />
						<circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" strokeLinecap="round" stroke="url(#ng-ring)" strokeDasharray={`${(pct / 100) * c} ${c}`} />
						<defs>
							<linearGradient id="ng-ring" x1="0" x2="1">
								<stop offset="0%" stopColor="#6366f1" />
								<stop offset="100%" stopColor="#a855f7" />
							</linearGradient>
						</defs>
					</svg>
					<div className="absolute inset-0 grid place-items-center text-center">
						<div>
							<div className="text-sm font-semibold text-slate-900 dark:text-white">900</div>
							<div className="text-[9px] text-slate-500">kcal left</div>
						</div>
					</div>
				</div>
				<div className="mt-3 space-y-2">
					<MacroBar label="Protein" pct={61} color="bg-sky-500" note="62g left" />
					<MacroBar label="Carbs" pct={48} color="bg-emerald-500" note="130g left" />
					<MacroBar label="Fat" pct={80} color="bg-amber-500" note="14g left" />
				</div>
			</div>
			{[
				{ meal: "Breakfast", food: "Greek yogurt, berries", kcal: 320 },
				{ meal: "Lunch", food: "Chicken rice bowl", kcal: 640 },
			].map((m) => (
				<div key={m.meal} className="rounded-xl bg-white dark:bg-slate-900 px-3 py-2 shadow-sm">
					<div className="flex justify-between text-[10px]">
						<span className="font-medium text-slate-900 dark:text-white">{m.meal}</span>
						<span className="text-slate-500">{m.kcal} kcal</span>
					</div>
					<p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{m.food}</p>
				</div>
			))}
		</>
	);
}

function WorkoutScreen() {
	return (
		<>
			<div className="flex items-center justify-between">
				<p className="text-[11px] font-semibold text-slate-900 dark:text-white">Push Day A</p>
				<span className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:text-emerald-300">
					In progress
				</span>
			</div>
			<div className="border-l-2 border-indigo-400 pl-2 space-y-2">
				<p className="text-[9px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Superset</p>
				{[
					{ name: "Bench Press", sets: ["185 × 8", "185 × 8", "185 × 7"] },
					{ name: "Barbell Row", sets: ["155 × 10", "155 × 10"] },
				].map((ex) => (
					<div key={ex.name} className="rounded-xl bg-white dark:bg-slate-900 px-3 py-2 shadow-sm">
						<p className="text-[10px] font-medium text-slate-900 dark:text-white">{ex.name}</p>
						<ul className="mt-1 space-y-0.5">
							{ex.sets.map((s, i) => (
								<li key={i} className="flex items-center justify-between text-[10px] tabular-nums">
									<span className="text-slate-400">{i + 1}</span>
									<span className="text-slate-700 dark:text-slate-200">{s}</span>
									<span className="text-emerald-500">✓</span>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
			<div className="rounded-xl bg-white dark:bg-slate-900 px-3 py-2 shadow-sm">
				<p className="text-[10px] font-medium text-slate-900 dark:text-white">Incline DB Press</p>
				<p className="text-[9px] text-indigo-600 dark:text-indigo-400">Last time: 60 × 10, 60 × 9</p>
			</div>
			<div className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-2 text-center text-[10px] font-medium text-white">
				Log set 3
			</div>
		</>
	);
}