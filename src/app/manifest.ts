import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {

	return {
		name: "NutriGym",
		short_name: "NutriGym",
		description: "Nutrition and fitness management by Softwarerror.",
		start_url: "/home",
		scope: "/",
		display: "standalone",
		orientation: "portrait",
		background_color: "#020617",
		theme_color: "#0f172a",
		icons: [
			{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
			{ src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
		],
	};

}