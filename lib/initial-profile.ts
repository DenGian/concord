import { auth, currentUser } from "@clerk/nextjs/server";

import { db } from "@/lib/db";

/**
 * Loads — or creates on first sign-in — the Profile for the current Clerk
 * user. Used by the setup page, which is the first authenticated page a
 * user lands on.
 */
export const initialProfile = async () => {
	const user = await currentUser();

	if (!user) {
		const { redirectToSignIn } = await auth();
		return redirectToSignIn();
	}

	const profile = await db.profile.findUnique({
		where: { userId: user.id },
	});

	if (profile) {
		return profile;
	}

	const name =
		[user.firstName, user.lastName].filter(Boolean).join(" ") ||
		user.username ||
		"New user";

	return db.profile.create({
		data: {
			userId: user.id,
			name,
			imageUrl: user.imageUrl,
			email: user.emailAddresses[0]?.emailAddress ?? "",
		},
	});
};
