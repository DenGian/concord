import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { conversationKey, realtimeHub } from "@/lib/realtime";
import { publicProfileSelect } from "@/lib/types";
import { messageSchema } from "@/lib/validations";

type Params = { params: Promise<{ directMessageId: string }> };

/**
 * Loads a direct message plus the requester's member record, verifying the
 * requester participates in the conversation.
 */
async function loadDirectMessage(
	directMessageId: string,
	conversationId: string,
	profileId: string,
) {
	const conversation = await db.conversation.findFirst({
		where: {
			id: conversationId,
			OR: [
				{ memberOne: { profileId } },
				{ memberTwo: { profileId } },
			],
		},
		include: { memberOne: true, memberTwo: true },
	});
	if (!conversation) return null;

	const member =
		conversation.memberOne.profileId === profileId
			? conversation.memberOne
			: conversation.memberTwo;

	const message = await db.directMessage.findFirst({
		where: { id: directMessageId, conversationId, deleted: false },
		include: {
			member: { include: { profile: { select: publicProfileSelect } } },
		},
	});
	if (!message) return null;

	return { member, message };
}

/**
 * PATCH /api/direct-messages/[directMessageId]?conversationId=... — edit.
 * Only the author can edit.
 */
export async function PATCH(req: Request, { params }: Params) {
	try {
		const profile = await currentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { directMessageId } = await params;
		const conversationId = new URL(req.url).searchParams.get("conversationId");
		if (!conversationId) {
			return new NextResponse("Conversation ID missing", { status: 400 });
		}

		const parsed = messageSchema.safeParse(await req.json());
		if (!parsed.success) {
			return NextResponse.json({ errors: parsed.error.issues }, { status: 422 });
		}

		const loaded = await loadDirectMessage(
			directMessageId,
			conversationId,
			profile.id,
		);
		if (!loaded) {
			return new NextResponse("Message not found", { status: 404 });
		}

		if (loaded.message.memberId !== loaded.member.id) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const message = await db.directMessage.update({
			where: { id: directMessageId },
			data: { content: parsed.data.content },
			include: {
				member: { include: { profile: { select: publicProfileSelect } } },
			},
		});

		realtimeHub.publish(
			conversationKey(conversationId),
			"message:update",
			message,
		);

		return NextResponse.json(message);
	} catch (error) {
		console.error("[DIRECT_MESSAGE_ID_PATCH]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}

/**
 * DELETE /api/direct-messages/[directMessageId]?conversationId=... —
 * soft-delete. In a 1:1 conversation only the author may delete.
 */
export async function DELETE(req: Request, { params }: Params) {
	try {
		const profile = await currentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { directMessageId } = await params;
		const conversationId = new URL(req.url).searchParams.get("conversationId");
		if (!conversationId) {
			return new NextResponse("Conversation ID missing", { status: 400 });
		}

		const loaded = await loadDirectMessage(
			directMessageId,
			conversationId,
			profile.id,
		);
		if (!loaded) {
			return new NextResponse("Message not found", { status: 404 });
		}

		if (loaded.message.memberId !== loaded.member.id) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const message = await db.directMessage.update({
			where: { id: directMessageId },
			data: {
				fileUrl: null,
				fileType: null,
				content: "This message has been deleted.",
				deleted: true,
			},
			include: {
				member: { include: { profile: { select: publicProfileSelect } } },
			},
		});

		realtimeHub.publish(
			conversationKey(conversationId),
			"message:update",
			message,
		);

		return NextResponse.json(message);
	} catch (error) {
		console.error("[DIRECT_MESSAGE_ID_DELETE]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
