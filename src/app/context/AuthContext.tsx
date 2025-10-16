"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logout } from "@/lib/api/auth";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  doLogout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    
	// states
    const [user, setUser]               	= useState<User | null>(null);
    const [permissions, setPermissions] 	= useState<string[]>([]);
    const [isLoading, setIsLoading]     	= useState(true);

    const router 		= useRouter();
    const pathname 		= usePathname();
    const isMounted 	= useRef(true);

	// paths we dont need to check auth for.
    const PUBLIC_PATHS = useMemo(
        () => new Set<string>(["/", "/login", "/signup", "/privacy", "/terms"]),
        []
    );

	// when a user is refreshed
	const refreshUser = async () => {

		// set loading
		setIsLoading(true);

		// fetch auth/me
		try {
			const res = await fetch("/api/auth/me", {
				credentials: "include",
				cache: "no-store",
			});

			if (!isMounted.current) return;

			if (res.ok) {

				const data = await res.json();
				if (data?.user) {
					setUser({
						id: data.user.id,
						name: data.user.name,
						email: data.user.email,
					});
					setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
				} else {
					setUser(null);
					setPermissions([]);
				}
			} else {
				setUser(null);
				setPermissions([]);
			}
		} catch (err) {
			if (!isMounted.current) return;
			console.error("Failed to fetch /api/me:", err);
			setUser(null);
			setPermissions([]);
		} finally {
			if (isMounted.current) setIsLoading(false);
		}

	};

	const doLogout = async () => {

		try {
			await logout();
		} catch (err) {
			console.warn("Logout request failed (continuing):", err);
		} finally {
			setUser(null);
			setPermissions([]);
			router.push("/");
		}

	};

	useEffect(() => {
		isMounted.current = true;
		void refreshUser();
		return () => {
			isMounted.current = false;
		};
	}, []);

	useEffect(() => {
		if (isLoading) return;
		const onPublicPage = PUBLIC_PATHS.has(pathname || "");
		if (!user && !onPublicPage) {
			router.push("/login");
		}
	}, [isLoading, user, pathname, router, PUBLIC_PATHS]);

	const value: AuthContextType = {
		user,
		permissions,
		isAuthenticated: !!user,
		isLoading,
		doLogout,
		refreshUser,
	};

	return (
		<AuthContext.Provider value={value}>
			<>
				{children}
				{isLoading && (
				<div className="fixed bottom-4 right-4 bg-gray-700 text-white px-4 py-2 rounded shadow-lg text-sm">
					Refreshing user...
				</div>
				)}
			</>
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
	return ctx;
};
