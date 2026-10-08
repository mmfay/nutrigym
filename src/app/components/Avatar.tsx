"use client";

import { useEffect, useState } from "react";
import type { AuthUser } from "@/app/providers/AuthProvider";

// "Matthew Fay" -> "MF", "cher" -> "C"
function initials(name: string | undefined) {
	const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/**
 * The signed-in user's profile photo, or their initials when there isn't one (or it fails to load).
 */
export default function Avatar({ user, size = 32, className = "" }: { user: AuthUser | null; size?: number; className?: string }) {

	const version = user?.avatar_version ?? null;
	const [failed, setFailed] = useState(false);

	useEffect(() => setFailed(false), [version]);

	const box = { width: size, height: size };

	if (version && !failed) {
		return (
			// eslint-disable-next-line @next/next/no-img-element -- private, per-user image served by our API
			<img
				src={`/api/usersettings/avatar?v=${encodeURIComponent(version)}`}
				alt=""
				width={size}
				height={size}
				onError={() => setFailed(true)}
				className={`shrink-0 rounded-full object-cover bg-slate-100 dark:bg-slate-800 ${className}`}
				style={box}
			/>
		);
	}

	return (
		<span
			aria-hidden
			className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 font-semibold text-white ${className}`}
			style={{ ...box, fontSize: Math.max(10, Math.round(size * 0.38)) }}
		>
			{initials(user?.name)}
		</span>
	);
}