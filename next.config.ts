import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
