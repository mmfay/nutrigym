"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import Avatar from "../Avatar";
import type { AuthUser } from "../../providers/AuthProvider";

type UserSettingsProps = {
	user: AuthUser | null;
	onLogout: () => void;
	isSysAdmin?: boolean;
};

export default function UserSettings({ user, onLogout, isSysAdmin = false }: UserSettingsProps) {

	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {

		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setMenuOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};

	}, []);

	return (
		<div className="relative" ref={menuRef}>
			<button
				type="button"
				onClick={() => setMenuOpen((prev) => !prev)}
				className="flex items-center gap-2 rounded-full border border-slate-300 bg-white pl-2 pr-3 py-1.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
				aria-haspopup="menu"
				aria-expanded={menuOpen}
				aria-label="Open user menu"
			>
				<Avatar user={user} size={32} />

				<ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
			</button>

			{menuOpen && (
				<div
					className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
					role="menu"
				>

					<div className="py-1">
						<Link
							href="/settings"
							className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
							role="menuitem"
							onClick={() => setMenuOpen(false)}
						>
							User Settings
						</Link>

						{isSysAdmin && (
							<Link
								href="/admin"
								className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
								role="menuitem"
								onClick={() => setMenuOpen(false)}
							>
								Admin Panel
							</Link>
						)}

						<button
							type="button"
							onClick={onLogout}
							className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
							role="menuitem"
						>
							Log out
						</button>
					</div>
				</div>
			)}
		</div>
	);
}