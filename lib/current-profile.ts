import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";

/**
 * Resolves the Profile of the currently signed-in Clerk user.
 *
 * Returns `null` when the visitor is not authenticated (or has no profile
 * yet) — callers are expected to treat that as a 401 / redirect.
 */
export const currentProfile = async () => {
	const { userId } = await auth();

	if (!userId) {
		return null;
	}

	return db.profile.findUnique({
		where: { userId },
	});
};
