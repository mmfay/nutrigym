"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";

export default function NavBar() {

	const pathname = usePathname();

	const auth = useAuth();

	// Treat homepage as marketing (adjust if you have other marketing routes)
	const isMarketing = pathname === "/";

	return (
		<header className="sticky top-0 z-30 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur bg-white/60 dark:bg-slate-900/60">
		<div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
			<div className="flex items-center gap-4">
			<Link
				href="/"
				className="font-semibold tracking-tight text-slate-900 dark:text-white"
			>
				NutriGym
			</Link>

			</div>

			{/* Center: marketing links on landing only */}
			{isMarketing && (
				<nav className="hidden md:flex items-center gap-8 text-sm text-slate-700 dark:text-slate-200">
					<a href="#features" className="hover:text-slate-900 dark:hover:text-white">
					Features
					</a>
					<a href="#faq" className="hover:text-slate-900 dark:hover:text-white">
					FAQ
					</a>
					<a href="#contact" className="hover:text-slate-900 dark:hover:text-white">
					Contact
					</a>
				</nav>
			)}


			{/* Right: auth buttons */}
			<div className="flex items-center gap-3">
			{!auth.isAuth ? (
				<>
				<Link
					href="/login"
					className="text-sm text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
				>
					Log in
				</Link>
				<Link
					href="/signup"
					className="text-sm rounded-md px-3 py-2 bg-slate-900 text-white hover:opacity-90 dark:bg-white dark:text-slate-900"
				>
					Sign up
				</Link>
				</>
			) : (
				<button
					type="button"
					onClick={auth.handleLogout}
					className="text-sm rounded-md px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50
								dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
				>
				Log out
				</button>
			)}
			</div>
		</div>
		</header>
	);
}
