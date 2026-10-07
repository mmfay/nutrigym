import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  eslint: {
	ignoreDuringBuilds: true,
  },
  typescript: {
	ignoreBuildErrors: true,
  },
  // always fetch the latest service worker so push / badge changes roll out
  async headers() {
	return [
		{
			source: "/sw.js",
			headers: [
				{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
				{ key: "Service-Worker-Allowed", value: "/" },
			],
		},
	];
  },
};

export default nextConfig;
