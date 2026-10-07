"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { login, logout, register, me, forgotPassword, resetPassword } from "@/lib/api/auth";
import { disablePushOnThisDevice } from "@/lib/utils/push";

export type AuthUser = {
	id: string;
	name: string;
	email: string;
	is_sys_admin?: boolean;
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
	handleForgotPassword: (email: string) => Promise<void>;
	handleResetPassword: (newPassword: string, token: string) => Promise<void>;
	refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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

			const user = res.data;

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
				throw new Error(res.message ?? "Login failed");
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
				throw new Error(res.message ?? "Signup failed");
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

			// stop workout reminders / badge on this device while we're still signed in
			await disablePushOnThisDevice();

			await logout();

			setUser(null);

			router.push("/");

		} finally {

			setLoading(false);

		}
	};

	// forgot password 
	const handleForgotPassword = async (email: string) => {

		setLoading(true);

		try {

			await forgotPassword(email)

		} finally {

			setLoading(false);

		}

	};

	// reset password 
	const handleResetPassword = async (newPassword: string, token: string) => {

		setLoading(true);

		try {

			await resetPassword(newPassword, token)

			router.push("/login");

		} finally {

			setLoading(false);

		}

	};

	const value: AuthContextValue = useMemo(
		() => ({ isAuth, user, loading, handleLogin, handleSignup, handleLogout, handleForgotPassword, handleResetPassword, refresh }),
		[isAuth, user, loading]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
	return ctx;
}