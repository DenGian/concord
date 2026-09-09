import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { MemberRole } from "@/lib/generated/prisma/browser";
import { serverSchema } from "@/lib/validations";

/**
 * POST /api/servers — create a server.
 *
 * The creator automatically becomes an ADMIN member and a default "general"
 * text channel is created.
 */
export async function POST(req: Request) {
	try {
		const profile = await currentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const parsed = serverSchema.safeParse(await req.json());
		if (!parsed.success) {
			return NextResponse.json({ errors: parsed.error.issues }, { status: 422 });
		}
		const { name, imageUrl } = parsed.data;

		const server = await db.server.create({
			data: {
				profileId: profile.id,
				name,
				imageUrl,
				inviteCode: crypto.randomUUID(),
				channels: {
					create: [{ name: "general", profileId: profile.id }],
				},
				members: {
					create: [{ profileId: profile.id, role: MemberRole.ADMIN }],
				},
			},
		});

		return NextResponse.json(server);
	} catch (error) {
		console.error("[SERVERS_POST]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
