import { redirect } from "next/navigation";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { ChannelType } from "@/lib/generated/prisma/browser";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { MediaRoom } from "@/components/media-room";

/**
 * A channel page. TEXT channels render the chat (history + composer);
 * AUDIO/VIDEO channels render a LiveKit media room.
 */
const ChannelIdPage = async ({
	params,
}: {
	params: Promise<{ serverId: string; channelId: string }>;
}) => {
	const profile = await currentProfile();
	if (!profile) {
		return redirect("/");
	}

	const { serverId, channelId } = await params;

	const channel = await db.channel.findUnique({
		where: { id: channelId },
	});

	const member = await db.member.findFirst({
		where: { serverId, profileId: profile.id },
	});

	if (!channel || channel.serverId !== serverId || !member) {
		return redirect("/");
	}

	return (
		<div className="bg-white dark:bg-[#313338] flex flex-col h-full">
			<ChatHeader name={channel.name} serverId={channel.serverId} type="channel" />
			{channel.type === ChannelType.TEXT && (
				<>
					<ChatMessages
						member={member}
						name={channel.name}
						chatId={channel.id}
						type="channel"
						apiUrl="/api/messages"
						socketUrl="/api/messages"
						socketQuery={{ channelId: channel.id, serverId: channel.serverId }}
						paramKey="channelId"
						paramValue={channel.id}
					/>
					<ChatInput
						name={channel.name}
						type="channel"
						apiUrl="/api/messages"
						query={{ channelId: channel.id, serverId: channel.serverId }}
					/>
				</>
			)}
			{channel.type === ChannelType.AUDIO && (
				<MediaRoom chatId={channel.id} video={false} audio={true} />
			)}
			{channel.type === ChannelType.VIDEO && (
				<MediaRoom chatId={channel.id} video={true} audio={true} />
			)}
		</div>
	);
};

export default ChannelIdPage;
