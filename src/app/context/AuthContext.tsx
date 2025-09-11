"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  is_sys_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {

    // states
    const [user, setUser]               = useState<User | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading]     = useState(true);

    const router    = useRouter();
    const pathname  = usePathname();
    const isMounted = useRef(true);

    // pages that dont redirect to login
    const PUBLIC_PATHS = useMemo(() => new Set<string>(["/", "/login", "/signup", "/privacy", "/terms"]), []);

    // when a user is refreshed
    const refreshUser = async () => {

        // show the screen as loading first
        setIsLoading(true);

        // try to call user and permission information
        try {

            const res = await fetch("/api/auth/me", { credentials: "include" });
            
            if (res.ok) {

                const data = await res.json();

                if (!isMounted.current) return;

                setUser({
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    is_sys_admin: data.user.is_sys_admin,
                });

                setPermissions(Array.isArray(data.permissions) ? data.permissions : []);

            } else {

                if (!isMounted.current) return;

                setUser(null);

                setPermissions([]);

            }

        } catch (err) {

            if (!isMounted.current) return;

            console.error("Failed to fetch /api/auth/me:", err);

            setUser(null);

            setPermissions([]);

        } finally {

            if (isMounted.current) 
                setIsLoading(false);

        }

    };

    // logout a user
    const logout = async () => {

        try {

            await fetch("/api/auth/logout", { method: "POST", credentials: "include" });

        } catch (err) {

            console.warn("Logout request failed (continuing):", err);

        } finally {

            // clear user and permissions, return to logout
            setUser(null);
            setPermissions([]);
            router.push("/login");

        }

    };

    // call refresh user
    useEffect(() => {

        isMounted.current = true;

        refreshUser();

        return () => {
            isMounted.current = false;
        };

    }, []);

    // redirect if unauthenticated and on a protected route
    useEffect(() => {

        if (isLoading) return;

        // checks if it is part of the public paths
        const onPublicPage = PUBLIC_PATHS.has(pathname || "");

        // route to login if protected and not logged in
        if (!user && !onPublicPage) {
            router.push("/login");
        }

    }, [isLoading, user, pathname, router, PUBLIC_PATHS]);

    const value: AuthContextType = {
        user,
        permissions,
        isAuthenticated: !!user,
        isLoading,
        logout,
        refreshUser,
    };
  
    // wrap what is passed to the authcontext
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

// how to access the context
export const useAuth = () => {

    const ctx = useContext(AuthContext);

    if (!ctx) 
        throw new Error("useAuth must be used within an AuthProvider");

    return ctx;

};
