import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

type Params = { params: Promise<{ serverId: string }> };

/**
 * PATCH /api/servers/[serverId]/leave — leave a server.
 * The owner cannot leave their own server (they must delete it instead).
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
				// Owners must delete, not leave — otherwise the server would be
				// orphaned without any admin.
				profileId: { not: profile.id },
				members: { some: { profileId: profile.id } },
			},
			data: {
				members: {
					deleteMany: { profileId: profile.id },
				},
			},
		});

		return NextResponse.json(server);
	} catch (error) {
		console.error("[SERVER_ID_LEAVE_PATCH]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
