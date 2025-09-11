"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [agree, setAgree] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// validate input
	function validate() {

		if (!name.trim()) return "Please enter your name.";
		if (!email.trim()) return "Please enter your email.";
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email.";
		if (password.length < 8) return "Password must be at least 8 characters.";
		if (password !== confirm) return "Passwords do not match.";
		if (!agree) return "Please agree to the Terms and Privacy Policy.";
		return null;

	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		const v = validate();
		if (v) { setError(v); return; }

		try {
			setLoading(true);
			// TODO: Replace with your real signup endpoint
			await new Promise((r) => setTimeout(r, 900));
			window.location.href = "/home"; // redirect after signup
		} catch (err: any) {
			setError(err?.message || "Signup failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
		{/* Top nav / brand */}
		<header className="px-6 py-5 flex items-center justify-between">
			<Link href="/" className="font-semibold tracking-tight text-slate-800 dark:text-slate-100">
			NutriGym
			</Link>
			<div className="text-sm text-slate-600 dark:text-slate-300">
			Already have an account? {" "}
			<Link href="/login" className="font-medium text-slate-900 hover:underline dark:text-white">
				Log in
			</Link>
			</div>
		</header>

		{/* Content */}
		<main className="px-6">
			<div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
			{/* Left: Value prop */}
			<section className="hidden lg:block">
				<div className="space-y-6">
				<h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
					Create your account
				</h1>
				<p className="text-slate-600 dark:text-slate-300 leading-relaxed">
					Set goals, save meals, and log food with speed. NutriGym keeps things clean and focused—no clutter, no gimmicks.
				</p>
				<ul className="text-slate-600 dark:text-slate-300 space-y-3">
					<li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-slate-400" /> Track macros & calories</li>
					<li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-slate-400" /> Save custom meals & recipes</li>
					<li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-slate-400" /> Fast food search; barcode scanning (mobile)</li>
				</ul>
				</div>
			</section>

			{/* Right: Signup card */}
			<section>
				<div className="relative">
				<div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 blur-xl opacity-60" aria-hidden />
				<div className="relative rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl">
					<div className="p-8 sm:p-10">
					<div className="mb-6">
						<h2 className="text-xl font-semibold text-slate-900 dark:text-white">Sign up</h2>
						<p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Start your free account</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-5">
						{/* Name */}
						<div className="space-y-2">
						<label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
							Name
						</label>
						<input
							id="name"
							type="text"
							autoComplete="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Your name"
							className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-200 dark:focus:ring-slate-800"
						/>
						</div>

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
						<label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
							Password
						</label>
						<div className="relative">
							<input
							id="password"
							type={showPassword ? "text" : "password"}
							autoComplete="new-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="At least 8 characters"
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

						{/* Confirm Password */}
						<div className="space-y-2">
						<label htmlFor="confirm" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
							Confirm password
						</label>
						<div className="relative">
							<input
							id="confirm"
							type={showConfirm ? "text" : "password"}
							autoComplete="new-password"
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
							placeholder="Re-type your password"
							className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 px-4 py-3 pr-12 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-200 dark:focus:ring-slate-800"
							/>
							<button
							type="button"
							onClick={() => setShowConfirm((v) => !v)}
							className="absolute inset-y-0 right-0 px-3 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
							aria-label={showConfirm ? "Hide password" : "Show password"}
							>
							{showConfirm ? "Hide" : "Show"}
							</button>
						</div>
						</div>

						{/* Terms */}
						<label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
						<input
							type="checkbox"
							checked={agree}
							onChange={(e) => setAgree(e.target.checked)}
							className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
						/>
						I agree to the {" "}
						<Link href="/terms" className="underline">Terms</Link> and {" "}
						<Link href="/privacy" className="underline">Privacy Policy</Link>.
						</label>

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
						{loading ? "Creating account…" : "Create account"}
						</button>

						{/* Divider */}
						<div className="relative py-2">
						<div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
						<div className="relative flex justify-center"><span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-500">or</span></div>
						</div>

						{/* Social providers (wire up later) */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<button type="button" className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60">
							Continue with Google
						</button>
						<button type="button" className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60">
							Continue with Apple
						</button>
						</div>

						{/* Login prompt (mobile) */}
						<p className="sm:hidden text-center text-sm text-slate-600 dark:text-slate-300">
						Already have an account? {" "}
						<Link href="/login" className="font-medium hover:underline">Log in</Link>
						</p>
					</form>
					</div>
				</div>
				</div>

				{/* Footer: subtle policy links */}
				<div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
				We care about your privacy. Read our {" "}
				<Link href="/privacy" className="underline">Privacy Policy</Link>.
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
