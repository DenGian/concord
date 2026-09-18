import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { communityManagerRoles } from "@/lib/permissions";
import { channelSchema } from "@/lib/validations";

/**
 * POST /api/channels?serverId=... — create a channel.
 * Requires ADMIN or MODERATOR membership in the server.
 */
export async function POST(req: Request) {
	try {
		const profile = await currentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const serverId = new URL(req.url).searchParams.get("serverId");
		if (!serverId) {
			return new NextResponse("Server ID missing", { status: 400 });
		}

		const parsed = channelSchema.safeParse(await req.json());
		if (!parsed.success) {
			return NextResponse.json({ errors: parsed.error.issues }, { status: 422 });
		}
		const { name, type } = parsed.data;

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
			data: {
				channels: {
					create: { profileId: profile.id, name, type },
				},
			},
		});

		return NextResponse.json(server);
	} catch (error) {
		console.error("[CHANNELS_POST]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
