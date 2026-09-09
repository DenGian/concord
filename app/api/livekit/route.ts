import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { ChannelType } from "@/lib/generated/prisma/browser";

export const dynamic = "force-dynamic";

/**
 * GET /api/livekit?room=... — mint a LiveKit access token so the current
 * user can join the given room (audio/video channels and 1:1 calls).
 *
 * Requires LIVEKIT_API_KEY / LIVEKIT_API_SECRET / NEXT_PUBLIC_LIVEKIT_URL;
 * the media-room component checks for these and shows a friendly message
 * when the feature is not configured.
 */
export async function GET(req: Request) {
	try {
		const profile = await currentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const room = new URL(req.url).searchParams.get("room");
		if (!room) {
			return new NextResponse("Room missing", { status: 400 });
		}

		// Room names are database ids. Verify access server-side before minting
		// a token, otherwise any signed-in user could join a guessed room id.
		const channel = await db.channel.findFirst({
			where: {
				id: room,
				type: { in: [ChannelType.AUDIO, ChannelType.VIDEO] },
				server: { members: { some: { profileId: profile.id } } },
			},
			select: { id: true },
		});

		const conversation = channel
			? null
			: await db.conversation.findFirst({
					where: {
						id: room,
						OR: [
							{ memberOne: { profileId: profile.id } },
							{ memberTwo: { profileId: profile.id } },
						],
					},
					select: { id: true },
				});

		if (!channel && !conversation) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const apiKey = process.env.LIVEKIT_API_KEY;
		const apiSecret = process.env.LIVEKIT_API_SECRET;
		if (!apiKey || !apiSecret) {
			return new NextResponse("LiveKit is not configured", { status: 503 });
		}

		const token = new AccessToken(apiKey, apiSecret, {
			identity: profile.id,
			name: profile.name,
		});
		token.addGrant({
			room,
			roomJoin: true,
			canPublish: true,
			canSubscribe: true,
		});

		return NextResponse.json({ token: await token.toJwt() });
	} catch (error) {
		console.error("[LIVEKIT_GET]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
