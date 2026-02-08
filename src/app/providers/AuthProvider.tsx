"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { login, logout, register, me } from "@/lib/api/auth";

export type AuthUser = {
	id: string;
	name: string;
	email: string;
};

export type AuthState = {
	isAuth: boolean;
	user: AuthUser | null;
	loading: boolean;
};

export type AuthContextValue = AuthState & {
	handleLogin: (email: string, password: string) => Promise<void>;
	handleSignup: (name: string, email: string, password: string) => Promise<void>;
	handleLogout: () => Promise<void>;
	refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

	async function safeJson(res: Response) {
		try {
			return await res.json();
		} catch {
			return null;
		}
	}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	const isAuth = !!user;

	const router = useRouter();

	// refersh calls me which gets user info if session is still valid. 
	const refresh = async () => {

		setLoading(true);

		try {

			const res = await me(); // ApiResult

			if (!res.ok) {
				setUser(null);
				return;
			}

			const user = (res.data as any)?.user as AuthUser | undefined;

			if (user) {
				setUser(user);
			} else {
				setUser(null);
			}

		} finally {

			setLoading(false);

		}

	};

	useEffect(() => {

		// On initial app load, check if cookie/session is valid
		refresh();

	}, []);

  	// login function
	const handleLogin = async (email: string, password: string) => {

		setLoading(true);

		try {

			const res = await login(email, password);

			if (!res.ok) {
				throw new Error(res.error ?? "Login failed");
			}

			// set the user
			await refresh();

			// route to home
			router.push("/home");

		} finally {

			setLoading(false);

		}

	};

  	// signup function
	const handleSignup = async (name: string, email: string, password: string) => {

		setLoading(true);

		try {

			const res = await register(email, name, password)

			if (!res.ok) {
				throw new Error(res.error ?? "Signup failed");
			}

			router.push('/login');

		} finally {

			setLoading(false);

		}

	};

  	// logout function
	const handleLogout = async () => {

		setLoading(true);

		try {

			await logout();

			setUser(null);

			router.push("/");

		} finally {

			setLoading(false);

		}
	};

	const value: AuthContextValue = useMemo(
		() => ({ isAuth, user, loading, handleLogin, handleSignup, handleLogout, refresh }),
		[isAuth, user, loading]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
	return ctx;
}
