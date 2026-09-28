import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "./providers/AuthProvider";
import NavBar from "./components/NavBar";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NutriGym | Softwarerror",
  description: "NutriGym is a Softwarerror product for nutrition and fitness management.",
  applicationName: "NutriGym",
  appleWebApp: {
    capable: true,
    title: "NutriGym",
    // content draws under the status bar; NavBar pads itself with safe-area-inset-top
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				{/* Dark scrim behind the (always white-text) iOS status bar in light mode */}
				<div
					aria-hidden
					className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[env(safe-area-inset-top)] bg-slate-900 dark:hidden"
				/>
				<AuthProvider>
					<NavBar />
					{children}
				</AuthProvider>
			</body>
		</html>
	);
}