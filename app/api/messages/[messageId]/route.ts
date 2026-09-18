import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { ChannelType } from "@/lib/generated/prisma/browser";
import { canDeleteChannelMessage } from "@/lib/permissions";
import { channelKey, realtimeHub } from "@/lib/realtime";
import { publicProfileSelect } from "@/lib/types";
import { messageSchema } from "@/lib/validations";

type Params = { params: Promise<{ messageId: string }> };

/**
 * Loads a message and the requesting member, verifying that the requester
 * belongs to the server the message's channel is in.
 */
async function loadMessageForUpdate(
	messageId: string,
	channelId: string,
	profileId: string,
) {
	const member = await db.member.findFirst({
		where: {
			profileId,
			server: {
				channels: { some: { id: channelId, type: ChannelType.TEXT } },
			},
		},
	});
	if (!member) return null;

	const message = await db.message.findFirst({
		where: { id: messageId, channelId, deleted: false },
		include: {
			member: { include: { profile: { select: publicProfileSelect } } },
		},
	});
	if (!message) return null;

	return { member, message };
}

/**
 * PATCH /api/messages/[messageId]?channelId=... — edit a message.
 * Only the author can edit, and file attachments cannot be edited.
 */
export async function PATCH(req: Request, { params }: Params) {
	try {
		const profile = await currentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { messageId } = await params;
		const channelId = new URL(req.url).searchParams.get("channelId");
		if (!channelId) {
			return new NextResponse("Channel ID missing", { status: 400 });
		}

		const parsed = messageSchema.safeParse(await req.json());
		if (!parsed.success) {
			return NextResponse.json({ errors: parsed.error.issues }, { status: 422 });
		}

		const loaded = await loadMessageForUpdate(messageId, channelId, profile.id);
		if (!loaded) {
			return new NextResponse("Message not found", { status: 404 });
		}

		if (loaded.message.memberId !== loaded.member.id) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const message = await db.message.update({
			where: { id: messageId },
			data: { content: parsed.data.content },
			include: {
				member: { include: { profile: { select: publicProfileSelect } } },
			},
		});

		realtimeHub.publish(channelKey(channelId), "message:update", message);

		return NextResponse.json(message);
	} catch (error) {
		console.error("[MESSAGE_ID_PATCH]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}

/**
 * DELETE /api/messages/[messageId]?channelId=... — soft-delete a message.
 * Allowed for the author, moderators and the admin. The row is kept as a
 * tombstone so the message position stays visible, matching Discord.
 */
export async function DELETE(req: Request, { params }: Params) {
	try {
		const profile = await currentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { messageId } = await params;
		const channelId = new URL(req.url).searchParams.get("channelId");
		if (!channelId) {
			return new NextResponse("Channel ID missing", { status: 400 });
		}

		const loaded = await loadMessageForUpdate(messageId, channelId, profile.id);
		if (!loaded) {
			return new NextResponse("Message not found", { status: 404 });
		}

		if (
			!canDeleteChannelMessage(
				loaded.member.role,
				loaded.member.id,
				loaded.message.memberId,
			)
		) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const message = await db.message.update({
			where: { id: messageId },
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

		realtimeHub.publish(channelKey(channelId), "message:update", message);

		return NextResponse.json(message);
	} catch (error) {
		console.error("[MESSAGE_ID_DELETE]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
