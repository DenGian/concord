import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { serverSchema } from "@/lib/validations";

type Params = { params: Promise<{ serverId: string }> };

/** PATCH /api/servers/[serverId] — update name/image. Admin only. */
export async function PATCH(req: Request, { params }: Params) {
	try {
		const profile = await currentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { serverId } = await params;

		const parsed = serverSchema.safeParse(await req.json());
		if (!parsed.success) {
			return NextResponse.json({ errors: parsed.error.issues }, { status: 422 });
		}

		const server = await db.server.update({
			// Restricting the WHERE to the owning profile makes this both the
			// lookup and the permission check: non-admins simply match nothing.
			where: { id: serverId, profileId: profile.id },
			data: parsed.data,
		});

		return NextResponse.json(server);
	} catch (error) {
		console.error("[SERVER_ID_PATCH]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}

/** DELETE /api/servers/[serverId] — delete the server. Admin only. */
export async function DELETE(_req: Request, { params }: Params) {
	try {
		const profile = await currentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { serverId } = await params;

		const server = await db.server.delete({
			where: { id: serverId, profileId: profile.id },
		});

		return NextResponse.json(server);
	} catch (error) {
		console.error("[SERVER_ID_DELETE]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
