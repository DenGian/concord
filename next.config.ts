import type { NextConfig } from "next";

const securityHeaders = [
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{
		key: "Permissions-Policy",
		value: "camera=(self), microphone=(self), geolocation=()",
	},
];

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: securityHeaders,
			},
		];
	},
	images: {
		// Remote hosts that next/image is allowed to optimize:
		// - *.ufs.sh / utfs.io  → UploadThing file storage (server images, attachments)
		// - img.clerk.com       → Clerk profile avatars
		remotePatterns: [
			{ protocol: "https", hostname: "*.ufs.sh" },
			{ protocol: "https", hostname: "utfs.io" },
			{ protocol: "https", hostname: "img.clerk.com" },
		],
	},
};

export default nextConfig;
