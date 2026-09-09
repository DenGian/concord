import { redirect } from "next/navigation";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

/**
 * /servers/[serverId] has no UI of its own — it forwards to the server's
 * default "general" channel.
 */
const ServerIdPage = async ({
	params,
}: {
	params: Promise<{ serverId: string }>;
}) => {
	const profile = await currentProfile();
	if (!profile) {
		return redirect("/");
	}

	const { serverId } = await params;

	const server = await db.server.findFirst({
		where: {
			id: serverId,
			members: { some: { profileId: profile.id } },
		},
		include: {
			channels: {
				where: { name: "general" },
				orderBy: { createdAt: "asc" },
			},
		},
	});

	const initialChannel = server?.channels[0];
	if (!initialChannel) {
		return redirect("/");
	}

	return redirect(`/servers/${serverId}/channels/${initialChannel.id}`);
};

export default ServerIdPage;
