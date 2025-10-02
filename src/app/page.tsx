import Link from "next/link";

export default function LandingPage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">

		{/* Hero */}
		<section className="relative">
			{/* Soft glow */}
			<div className="pointer-events-none absolute inset-x-0 -top-16 h-72 bg-gradient-to-b from-slate-200/50 to-transparent dark:from-slate-800/40" aria-hidden />
			<div className="mx-auto max-w-7xl px-6 pt-16 pb-10 lg:pt-24 lg:pb-16">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
				<div className="space-y-6">
				<span className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 backdrop-blur">
					All‑in‑one nutrition • Privacy‑first • Fast
				</span>
				<h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">
					Track meals in seconds,
					<br className="hidden sm:block" /> hit your macro goals with clarity.
				</h1>
				<p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl">
					NutriGym brings barcode scanning (mobile soon), lightning‑fast food search, custom meals & recipes, and focused insights into a clean, no‑nonsense workspace.
				</p>
				<div className="flex flex-col sm:flex-row gap-3">
					<Link href="/signup" className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-5 py-3 font-medium shadow-lg shadow-slate-900/10 hover:opacity-95 active:opacity-90">
					Create your account
					</Link>
					<Link href="/login" className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-3 font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60">
					I already have an account
					</Link>
				</div>
				{/* Trust signals */}
				<div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400 pt-2">
					<div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Instant logging</div>
					<div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-500" /> Macro insights</div>
					<div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-fuchsia-500" /> Offline‑friendly</div>
				</div>
				</div>

				{/* Mock screenshot card */}
				<div className="relative">
				<div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 blur-xl opacity-60" aria-hidden />
				<div className="relative rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl overflow-hidden">
					<div className="aspect-[16/10] w-full">
					{/* Replace this placeholder with an <Image /> or live preview */}
					<div className="h-full w-full grid grid-cols-12">
						<div className="col-span-4 border-r border-slate-200/60 dark:border-slate-800/60 p-6">
						<div className="h-6 w-24 rounded bg-slate-200 dark:bg-slate-800 mb-4" />
						<div className="space-y-3">
							{[...Array(7)].map((_, i) => (
							<div key={i} className="h-3 w-10/12 rounded bg-slate-200 dark:bg-slate-800" />
							))}
						</div>
						</div>
						<div className="col-span-8 p-6">
						<div className="h-8 w-40 rounded bg-slate-200 dark:bg-slate-800 mb-6" />
						<div className="space-y-4">
							{[...Array(5)].map((_, i) => (
							<div key={i} className="h-20 w-full rounded-xl border border-slate-200 dark:border-slate-800" />
							))}
						</div>
						</div>
					</div>
					</div>
				</div>
				</div>
			</div>
			</div>
		</section>

		{/* Features */}
		<section id="features" className="mx-auto max-w-7xl px-6 py-16">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
			{[
				{
				title: "Fast food search",
				body: "Search across a clean database with smart synonyms and quick‑add macros.",
				},
				{
				title: "Custom meals & recipes",
				body: "Save your go‑tos, batch cook, and reuse with one tap.",
				},
				{
				title: "Goals & insights",
				body: "Set calorie/macro targets and see simple, actionable trends.",
				},
				{
				title: "Barcode scanning (mobile)",
				body: "Use your phone’s camera in the Expo app to scan and log instantly.",
				},
				{
				title: "Offline‑friendly",
				body: "Keep logging even on spotty connections; sync when you’re back.",
				},
				{
				title: "Privacy‑first",
				body: "Your data stays yours. Clear controls for export and deletion.",
				},
			].map((f) => (
				<div key={f.title} className="relative">
				<div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 blur opacity-50" aria-hidden />
				<div className="relative rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6">
					<h3 className="text-base font-semibold text-slate-900 dark:text-white">{f.title}</h3>
					<p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.body}</p>
				</div>
				</div>
			))}
			</div>
		</section>

		{/* How it works */}
		<section id="how" className="mx-auto max-w-7xl px-6 pb-16">
			<div className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8">
			<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">How it works</h2>
			<ol className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
				{[
				{ step: "1", title: "Set your goal", body: "Choose calories & macros; we create sensible defaults you can tweak." },
				{ step: "2", title: "Log quickly", body: "Search or scan; recent foods and saved meals make it instant." },
				{ step: "3", title: "See progress", body: "Get clean visuals and nudges to help you stay consistent." },
				].map((s) => (
				<li key={s.step} className="flex items-start gap-4">
					<span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200">{s.step}</span>
					<div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-white">{s.title}</h3>
					<p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{s.body}</p>
					</div>
				</li>
				))}
			</ol>
			</div>
		</section>

		{/* CTA */}
		<section className="mx-auto max-w-7xl px-6 pb-20">
			<div className="relative overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-tr from-slate-900 to-slate-700 dark:from-slate-900 dark:to-slate-800">
			<div className="absolute -inset-1 bg-gradient-to-tr from-white/10 to-transparent blur-2xl" aria-hidden />
			<div className="relative p-8 md:p-12">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
				<div>
					<h2 className="text-2xl md:text-3xl font-semibold text-white">Start your streak today</h2>
					<p className="mt-2 text-slate-200 text-sm md:text-base max-w-md">Create an account and log your first meal in under a minute. Keep it simple and consistent.</p>
				</div>
				<div className="flex md:justify-end gap-3">
					<Link href="/signup" className="inline-flex items-center justify-center rounded-xl bg-white text-slate-900 px-5 py-3 font-medium shadow hover:opacity-95 active:opacity-90">Create account</Link>
					<Link href="/login" className="inline-flex items-center justify-center rounded-xl border border-white/60 text-white px-5 py-3 font-medium hover:bg-white/10">Log in</Link>
				</div>
				</div>
			</div>
			</div>
		</section>

		{/* Footer */}
		<footer id="contact" className="border-t border-slate-200/60 dark:border-slate-800/60">
			<div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
			<div>
				<div className="font-semibold text-slate-900 dark:text-white">NutriGym</div>
				<p className="mt-2 text-slate-600 dark:text-slate-300">A focused nutrition app for logging without the clutter.</p>
			</div>
			<div className="text-slate-600 dark:text-slate-300">
				<div className="font-medium text-slate-900 dark:text-white">Product</div>
				<ul className="mt-2 space-y-2">
				<li><a href="#features" className="hover:underline">Features</a></li>
				<li><a href="#how" className="hover:underline">How it works</a></li>
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
