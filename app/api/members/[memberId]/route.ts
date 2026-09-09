import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { MemberRole } from "@/lib/generated/prisma/browser";
import { publicProfileSelect } from "@/lib/types";
import * as z from "zod";

type Params = { params: Promise<{ memberId: string }> };

const roleSchema = z.object({
	// Only GUEST/MODERATOR can be assigned; ADMIN is reserved for the owner.
	role: z.enum([MemberRole.GUEST, MemberRole.MODERATOR]),
});

/**
 * PATCH /api/members/[memberId]?serverId=... — change a member's role.
 * Only the server owner can manage roles, and not their own.
 */
export async function PATCH(req: Request, { params }: Params) {
	try {
		const profile = await currentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { memberId } = await params;
		const serverId = new URL(req.url).searchParams.get("serverId");
		if (!serverId) {
			return new NextResponse("Server ID missing", { status: 400 });
		}

		const parsed = roleSchema.safeParse(await req.json());
		if (!parsed.success) {
			return NextResponse.json({ errors: parsed.error.issues }, { status: 422 });
		}

		const server = await db.server.update({
			where: { id: serverId, profileId: profile.id },
			data: {
				members: {
					update: {
						where: {
							id: memberId,
							// The owner cannot demote themselves.
							profileId: { not: profile.id },
						},
						data: { role: parsed.data.role },
					},
				},
			},
			include: {
				members: {
					include: { profile: { select: publicProfileSelect } },
					orderBy: { role: "asc" },
				},
			},
		});

		return NextResponse.json(server);
	} catch (error) {
		console.error("[MEMBER_ID_PATCH]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}

/**
 * DELETE /api/members/[memberId]?serverId=... — kick a member.
 * Only the server owner can kick, and not themselves.
 */
export async function DELETE(req: Request, { params }: Params) {
	try {
		const profile = await currentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { memberId } = await params;
		const serverId = new URL(req.url).searchParams.get("serverId");
		if (!serverId) {
			return new NextResponse("Server ID missing", { status: 400 });
		}

		const server = await db.server.update({
			where: { id: serverId, profileId: profile.id },
			data: {
				members: {
					deleteMany: {
						id: memberId,
						profileId: { not: profile.id },
					},
				},
			},
			include: {
				members: {
					include: { profile: { select: publicProfileSelect } },
					orderBy: { role: "asc" },
				},
			},
		});

		return NextResponse.json(server);
	} catch (error) {
		console.error("[MEMBER_ID_DELETE]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
