import { redirect } from "next/navigation";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { getOrCreateConversation } from "@/lib/conversation";
import { publicProfileSelect } from "@/lib/types";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { MediaRoom } from "@/components/media-room";

/**
 * A 1:1 conversation with another member of the server. With ?video=true
 * the chat is replaced by a LiveKit call.
 */
const MemberIdPage = async ({
	params,
	searchParams,
}: {
	params: Promise<{ serverId: string; memberId: string }>;
	searchParams: Promise<{ video?: string }>;
}) => {
	const profile = await currentProfile();
	if (!profile) {
		return redirect("/");
	}

	const { serverId, memberId } = await params;
	const { video } = await searchParams;

	const currentMember = await db.member.findFirst({
		where: { serverId, profileId: profile.id },
	});

	if (!currentMember) {
		return redirect("/");
	}

	// Never create conversations from an arbitrary member id. The target must
	// be another member of this same server.
	const otherMember = await db.member.findFirst({
		where: {
			id: { equals: memberId, not: currentMember.id },
			serverId,
		},
		include: { profile: { select: publicProfileSelect } },
	});

	if (!otherMember) {
		return redirect(`/servers/${serverId}`);
	}

	const conversation = await getOrCreateConversation(
		currentMember.id,
		otherMember.id,
	);

	if (!conversation) {
		return redirect(`/servers/${serverId}`);
	}

	return (
		<div className="bg-white dark:bg-[#313338] flex flex-col h-full">
			<ChatHeader
				imageUrl={otherMember.profile.imageUrl}
				name={otherMember.profile.name}
				serverId={serverId}
				type="conversation"
			/>
			{video && (
				<MediaRoom chatId={conversation.id} video={true} audio={true} />
			)}
			{!video && (
				<>
					<ChatMessages
						member={currentMember}
						name={otherMember.profile.name}
						chatId={conversation.id}
						type="conversation"
						apiUrl="/api/direct-messages"
						mutationUrl="/api/direct-messages"
						mutationQuery={{ conversationId: conversation.id }}
						paramKey="conversationId"
						paramValue={conversation.id}
					/>
					<ChatInput
						name={otherMember.profile.name}
						type="conversation"
						apiUrl="/api/direct-messages"
						query={{ conversationId: conversation.id }}
					/>
				</>
			)}
		</div>
	);
};

export default MemberIdPage;
