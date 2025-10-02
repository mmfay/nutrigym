"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

export default function AppNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, doLogout } = useAuth();

  // Guard to avoid SSR/CSR mismatches
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isMarketing = pathname === "/";
  const isLoginPage = pathname === "/login";
  const isSignupPage = pathname === "/signup";

  const crumb = useMemo(() => {
    if (pathname === "/") return "Home";
    if (pathname?.startsWith("/foods")) return "Foods";
    if (pathname?.startsWith("/meals")) return "Meals";
    if (pathname?.startsWith("/profile")) return "Profile";
    return "";
  }, [pathname]);

  const appNav = [
    { href: "/foods", label: "Foods" },
    { href: "/meals", label: "Meals" },
    { href: "/profile", label: "Profile" },
  ];

  // Keep labels consistent across SSR/CSR (prevents text mismatch)
  const signupLabel = "Get started"; // or "Sign up" – just use ONE everywhere

  const linkBase =
    "rounded-xl px-3 py-1.5 text-sm transition border focus:outline-none focus:ring-2 focus:ring-slate-300/50 dark:focus:ring-slate-700/60";
  const activeCls =
    "bg-slate-900 text-white border-transparent shadow hover:opacity-95";
  const idleCls =
    "border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60";

  async function handleLogout() {
    try {
      await doLogout();
    } finally {
      router.push("/");
    }
  }

  // ---------- render ----------
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur bg-white/60 dark:bg-slate-900/60">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        {/* Left: Brand + crumb */}
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold tracking-tight text-slate-900 dark:text-white">
            NutriGym
          </Link>
          {!isMarketing && crumb && (
            <span className="text-xs text-slate-500 dark:text-slate-400">{crumb}</span>
          )}
        </div>

        {/* Center: marketing links on landing only (smaller font as requested) */}
        {isMarketing && (
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-200/90">
            <a href="#features" className="hover:opacity-90">Features</a>
            <a href="#how" className="hover:opacity-90">How it works</a>
            <a href="#faq" className="hover:opacity-90">FAQ</a>
            <a href="#contact" className="hover:opacity-90">Contact</a>
          </nav>
        )}

        {/* Right: keep SSR stable; decide after mount */}
        <div className="flex items-center gap-3">
          {!mounted || isLoading ? (
            // SSR/Loading placeholder to keep markup identical between server & client
            <>
              <span className={`${linkBase} ${idleCls} opacity-60 select-none`}>Log in</span>
              <span className={`${linkBase} ${activeCls} opacity-60 select-none`}>{signupLabel}</span>
            </>
          ) : isAuthenticated ? (
            <>
              <nav className="hidden sm:flex items-center gap-3">
                {appNav.map((n) => {
                  const active = pathname === n.href || pathname?.startsWith(n.href + "/");
                  return (
                    <Link key={n.href} href={n.href} className={`${linkBase} ${active ? activeCls : idleCls}`}>
                      {n.label}
                    </Link>
                  );
                })}
              </nav>
              <button onClick={handleLogout} className={`${linkBase} ${idleCls}`}>Log out</button>
            </>
          ) : isLoginPage ? (
            <Link href="/signup" className="text-sm hover:underline">
              New here? Create an account
            </Link>
          ) : isSignupPage ? (
            <Link href="/login" className="text-sm hover:underline">
              Already have an account? Log in
            </Link>
          ) : (
            <>
              <Link href="/login" className={`${linkBase} ${idleCls}`}>Log in</Link>
              <Link href="/signup" className={`${linkBase} ${activeCls}`}>{signupLabel}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
