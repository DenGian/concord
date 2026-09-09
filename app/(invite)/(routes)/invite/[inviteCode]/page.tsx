import { redirect } from "next/navigation";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { initialProfile } from "@/lib/initial-profile";

/**
 * Invite landing page: /invite/[inviteCode]
 *
 * Joins the signed-in user to the server behind the code and redirects into
 * it. Users who are already members are simply redirected. Invalid codes
 * fall through to the setup page.
 */
const InviteCodePage = async ({
	params,
}: {
	params: Promise<{ inviteCode: string }>;
}) => {
	// Ensure a profile exists — an invite link may be the very first page a
	// brand-new user ever visits.
	let profile = await currentProfile();
	if (!profile) {
		profile = await initialProfile();
	}

	const { inviteCode } = await params;
	if (!inviteCode) {
		return redirect("/");
	}

	// Already a member? Go straight in.
	const existingServer = await db.server.findFirst({
		where: {
			inviteCode,
			members: { some: { profileId: profile.id } },
		},
	});

	if (existingServer) {
		return redirect(`/servers/${existingServer.id}`);
	}

	const server = await db.server.update({
		where: { inviteCode },
		data: {
			members: { create: [{ profileId: profile.id }] },
		},
	}).catch(() => null); // Unknown invite code.

	if (server) {
		return redirect(`/servers/${server.id}`);
	}

	return redirect("/");
};

export default InviteCodePage;
