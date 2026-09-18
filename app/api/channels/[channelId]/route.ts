import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { communityManagerRoles } from "@/lib/permissions";
import { channelSchema } from "@/lib/validations";

type Params = { params: Promise<{ channelId: string }> };

/**
 * PATCH /api/channels/[channelId]?serverId=... — rename / retype a channel.
 * Requires ADMIN or MODERATOR membership; "general" cannot be edited.
 */
export async function PATCH(req: Request, { params }: Params) {
	try {
		const profile = await currentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { channelId } = await params;
		const serverId = new URL(req.url).searchParams.get("serverId");
		if (!serverId) {
			return new NextResponse("Server ID missing", { status: 400 });
		}

		const parsed = channelSchema.safeParse(await req.json());
		if (!parsed.success) {
			return NextResponse.json({ errors: parsed.error.issues }, { status: 422 });
		}

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
					update: {
						where: { id: channelId, NOT: { name: "general" } },
						data: parsed.data,
					},
				},
			},
		});

		return NextResponse.json(server);
	} catch (error) {
		console.error("[CHANNEL_ID_PATCH]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}

/**
 * DELETE /api/channels/[channelId]?serverId=... — delete a channel.
 * Requires ADMIN or MODERATOR membership; "general" cannot be deleted.
 */
export async function DELETE(req: Request, { params }: Params) {
	try {
		const profile = await currentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { channelId } = await params;
		const serverId = new URL(req.url).searchParams.get("serverId");
		if (!serverId) {
			return new NextResponse("Server ID missing", { status: 400 });
		}

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
					delete: { id: channelId, NOT: { name: "general" } },
				},
			},
		});

		return NextResponse.json(server);
	} catch (error) {
		console.error("[CHANNEL_ID_DELETE]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
