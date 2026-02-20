"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";

export default function NavBar() {
	const pathname = usePathname();
	const router = useRouter();
	const auth = useAuth();

	const isMarketing = pathname === "/";

	const mobileValue = pathname === "/foods" || pathname === "/home" ? pathname : "/home";

	return (
		<header className="sticky top-0 z-30 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur bg-white/60 dark:bg-slate-900/60">
		<div className="mx-auto max-w-7xl px-6 py-4 flex items-center gap-4">
			{/* Left: brand */}
			<Link
				href={auth.isAuth ? "/home" : "/"}
				className="font-semibold tracking-tight text-slate-900 dark:text-white"
			>
			NutriGym
			</Link>

			{/* Center: takes remaining space so content can be truly centered */}
			<div className="flex-1 flex justify-center">
			{/* App nav (desktop) + mobile dropdown */}
			{!isMarketing && auth.isAuth && (
				<>
				{/* Desktop links */}
				<nav className="hidden md:flex items-center gap-8 text-sm text-slate-700 dark:text-slate-200">
					<Link href="/home" className="hover:text-slate-900 dark:hover:text-white">
					Home
					</Link>
					<Link href="/foods" className="hover:text-slate-900 dark:hover:text-white">
					Logging
					</Link>
				</nav>

				{/* Mobile dropdown */}
				<div className="md:hidden">
					<select
					value={mobileValue}
					onChange={(e) => router.push(e.target.value)}
					className="
						w-[140px] sm:w-[160px]
						rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800
						dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100
					"
					aria-label="Navigate"
					>
					<option value="/home">Home</option>
					<option value="/foods">Logging</option>
					</select>
				</div>
				</>
			)}

			{/* Marketing links (desktop only) */}
			{/*
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
			*/}
			</div>

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
				<>
				{/* ✅ Dashboard only on marketing page */}
				{isMarketing && (
					<Link
					href="/home"
					className="text-sm rounded-md px-3 py-2 bg-slate-900 text-white hover:opacity-90 dark:bg-white dark:text-slate-900"
					>
					Dashboard
					</Link>
				)}

				<button
					type="button"
					onClick={auth.handleLogout}
					className="text-sm rounded-md px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50
							dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
				>
					Log out
				</button>
				</>
			)}
			</div>
		</div>
		</header>
	);
}