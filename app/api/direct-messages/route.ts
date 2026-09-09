import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { conversationKey, realtimeHub } from "@/lib/realtime";
import { publicProfileSelect } from "@/lib/types";
import { chatMessageSchema } from "@/lib/validations";

// Number of messages returned per page of infinite scroll.
const MESSAGES_BATCH = 25;

/**
 * Loads a conversation and verifies the requesting profile participates in
 * it. Returns the conversation plus the requester's member record.
 */
async function loadConversation(conversationId: string, profileId: string) {
	const conversation = await db.conversation.findFirst({
		where: {
			id: conversationId,
			OR: [
				{ memberOne: { profileId } },
				{ memberTwo: { profileId } },
			],
		},
		include: {
			memberOne: true,
			memberTwo: true,
		},
	});
	if (!conversation) return null;

	const member =
		conversation.memberOne.profileId === profileId
			? conversation.memberOne
			: conversation.memberTwo;

	return { conversation, member };
}

/**
 * GET /api/direct-messages?conversationId=...&cursor=... — paginated 1:1
 * history, newest first (same contract as /api/messages).
 */
export async function GET(req: Request) {
	try {
		const profile = await currentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const conversationId = searchParams.get("conversationId");
		const cursor = searchParams.get("cursor");

		if (!conversationId) {
			return new NextResponse("Conversation ID missing", { status: 400 });
		}

		const loaded = await loadConversation(conversationId, profile.id);
		if (!loaded) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const messages = await db.directMessage.findMany({
			take: MESSAGES_BATCH,
			...(cursor && { skip: 1, cursor: { id: cursor } }),
			where: { conversationId },
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
		console.error("[DIRECT_MESSAGES_GET]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}

/**
 * POST /api/direct-messages?conversationId=... — send a direct message.
 * Broadcasts a "message:new" event to both participants.
 */
export async function POST(req: Request) {
	try {
		const profile = await currentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const conversationId = searchParams.get("conversationId");
		if (!conversationId) {
			return new NextResponse("Conversation ID missing", { status: 400 });
		}

		const parsed = chatMessageSchema.safeParse(await req.json());
		if (!parsed.success) {
			return NextResponse.json({ errors: parsed.error.issues }, { status: 422 });
		}
		const { content, fileUrl, fileType } = parsed.data;

		const loaded = await loadConversation(conversationId, profile.id);
		if (!loaded) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const message = await db.directMessage.create({
			data: {
				content: content ?? "",
				fileUrl,
				fileType,
				conversationId,
				memberId: loaded.member.id,
			},
			include: {
				member: { include: { profile: { select: publicProfileSelect } } },
			},
		});

		realtimeHub.publish(
			conversationKey(conversationId),
			"message:new",
			message,
		);

		return NextResponse.json(message);
	} catch (error) {
		console.error("[DIRECT_MESSAGES_POST]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
