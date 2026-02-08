"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";

export default function LoginPage() {

	const auth = useAuth();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {

		e.preventDefault();
		setError(null);
		setLoading(true);

		try {

			await auth.handleLogin(email, password);

		} catch (e: any) {
			
			setError(e?.message || "Network error");

		} finally {

			setLoading(false);

		}
		
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
		{/* Content */}
		<main className="px-6 pt-16">
			<div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
			{/* Left: Value prop */}
			<section className="hidden lg:block">
				<div className="space-y-6">
				<h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
					Welcome back
				</h1>
				<p className="text-slate-600 dark:text-slate-300 leading-relaxed">
					Log your meals in seconds, visualize macros, and stay consistent with a calm, focused interface.
					Your data stays yours—privacy-first and designed for speed.
				</p>
				<ul className="text-slate-600 dark:text-slate-300 space-y-3">
					<li className="flex items-start gap-3">
					<span className="mt-1 h-2 w-2 rounded-full bg-slate-400" /> Barcode & text search
					</li>
					<li className="flex items-start gap-3">
					<span className="mt-1 h-2 w-2 rounded-full bg-slate-400" /> Custom meals & recipes
					</li>
					<li className="flex items-start gap-3">
					<span className="mt-1 h-2 w-2 rounded-full bg-slate-400" /> Macro goals & insights
					</li>
				</ul>
				</div>
			</section>

			{/* Right: Auth card */}
			<section>
				<div className="relative">
				{/* Subtle glow */}
				<div
					className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 blur-xl opacity-60"
					aria-hidden
				/>
				<div className="relative rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl">
					<div className="p-8 sm:p-10">
					<div className="mb-6">
						<h2 className="text-xl font-semibold text-slate-900 dark:text-white">Log in</h2>
						<p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Continue to your dashboard</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-5">
						{/* Email */}
						<div className="space-y-2">
						<label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
							Email
						</label>
						<input
							id="email"
							type="email"
							autoComplete="email"
							inputMode="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@example.com"
							className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-200 dark:focus:ring-slate-800"
						/>
						</div>

						{/* Password */}
						<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
							Password
							</label>
							<Link href="/forgot-password" className="text-xs text-slate-600 hover:underline dark:text-slate-300">
							Forgot password?
							</Link>
						</div>
						<div className="relative">
							<input
							id="password"
							type={showPassword ? "text" : "password"}
							autoComplete="current-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••••"
							className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 px-4 py-3 pr-12 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-200 dark:focus:ring-slate-800"
							/>
							<button
							type="button"
							onClick={() => setShowPassword((v) => !v)}
							className="absolute inset-y-0 right-0 px-3 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
							aria-label={showPassword ? "Hide password" : "Show password"}
							>
							{showPassword ? "Hide" : "Show"}
							</button>
						</div>
						</div>

						{/* Remember me */}
						<div className="flex items-center justify-between">
						<label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
							<input type="checkbox" className="h-4 w-4 rounded border-slate-300 dark:border-slate-600" />
							Remember me
						</label>
						</div>

						{/* Error */}
						{error && (
						<div className="rounded-xl border border-red-300/50 dark:border-red-800/40 bg-red-50/80 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-200">
							{error}
						</div>
						)}

						{/* Submit */}
						<button
						type="submit"
						disabled={loading}
						className="w-full rounded-xl bg-slate-900 text-white py-3 font-medium shadow-lg shadow-slate-900/10 hover:opacity-95 active:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
						>
						{loading ? "Signing in…" : "Sign in"}
						</button>
					</form>
					</div>
				</div>
				</div>

				{/* Footer: subtle policy links */}
				<div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
				By continuing you agree to our{" "}
				<Link href="/terms" className="underline">
					Terms
				</Link>{" "}
				and{" "}
				<Link href="/privacy" className="underline">
					Privacy Policy
				</Link>
				.
				</div>
			</section>
			</div>
		</main>

		{/* Minimal footer */}
		<footer className="px-6 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
			© {new Date().getFullYear()} NutriGym. All rights reserved.
		</footer>
		</div>
	);

}
