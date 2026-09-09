import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { ChannelType } from "@/lib/generated/prisma/browser";
import { channelKey, realtimeHub } from "@/lib/realtime";
import { publicProfileSelect } from "@/lib/types";
import { chatMessageSchema } from "@/lib/validations";

// Number of messages returned per page of infinite scroll.
const MESSAGES_BATCH = 25;

/**
 * GET /api/messages?channelId=...&cursor=... — paginated channel history.
 *
 * Cursor-based pagination, newest first: the client asks for the page after
 * the last message id it has, until `nextCursor` comes back null.
 */
export async function GET(req: Request) {
	try {
		const profile = await currentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const channelId = searchParams.get("channelId");
		const cursor = searchParams.get("cursor");

		if (!channelId) {
			return new NextResponse("Channel ID missing", { status: 400 });
		}

		// The requester must be a member of the server the channel belongs to.
		const member = await db.member.findFirst({
			where: {
				profileId: profile.id,
				server: {
					channels: { some: { id: channelId, type: ChannelType.TEXT } },
				},
			},
		});
		if (!member) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const messages = await db.message.findMany({
			take: MESSAGES_BATCH,
			...(cursor && { skip: 1, cursor: { id: cursor } }),
			where: { channelId },
			include: {
				member: { include: { profile: { select: publicProfileSelect } } },
			},
			orderBy: { createdAt: "desc" },
		});

		const nextCursor =
			messages.length === MESSAGES_BATCH
				? messages[MESSAGES_BATCH - 1].id
				: null;

		return NextResponse.json({ items: messages, nextCursor });
	} catch (error) {
		console.error("[MESSAGES_GET]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}

/**
 * POST /api/messages?channelId=...&serverId=... — send a message.
 * Broadcasts a "message:new" event to everyone watching the channel.
 */
export async function POST(req: Request) {
	try {
		const profile = await currentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const channelId = searchParams.get("channelId");
		const serverId = searchParams.get("serverId");

		if (!serverId || !channelId) {
			return new NextResponse("Server ID or Channel ID missing", {
				status: 400,
			});
		}

		const parsed = chatMessageSchema.safeParse(await req.json());
		if (!parsed.success) {
			return NextResponse.json({ errors: parsed.error.issues }, { status: 422 });
		}
		const { content, fileUrl, fileType } = parsed.data;

		const member = await db.member.findFirst({
			where: { profileId: profile.id, serverId },
		});
		if (!member) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const channel = await db.channel.findFirst({
			where: { id: channelId, serverId, type: ChannelType.TEXT },
		});
		if (!channel) {
			return new NextResponse("Channel not found", { status: 404 });
		}

		const message = await db.message.create({
			data: {
				content: content ?? "",
				fileUrl,
				fileType,
				channelId,
				memberId: member.id,
			},
			include: {
				member: { include: { profile: { select: publicProfileSelect } } },
			},
		});

		realtimeHub.publish(channelKey(channelId), "message:new", message);

		return NextResponse.json(message);
	} catch (error) {
		console.error("[MESSAGES_POST]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
