import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { communityManagerRoles } from "@/lib/permissions";

type Params = { params: Promise<{ serverId: string }> };

/**
 * PATCH /api/servers/[serverId]/invite-code — rotate the invite code,
 * invalidating previously shared invite links. Admin or moderator only.
 */
export async function PATCH(_req: Request, { params }: Params) {
	try {
		const profile = await currentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { serverId } = await params;

		const server = await db.server.update({
			where: {
				id: serverId,
				members: {
					some: {
						profileId: profile.id,
						role: { in: communityManagerRoles },
					},
				},
			},
			data: { inviteCode: crypto.randomUUID() },
		});

		return NextResponse.json(server);
	} catch (error) {
		console.error("[SERVER_ID_INVITE_CODE_PATCH]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
