"use client";

import { Plus, Settings } from "lucide-react";

import { ChannelType, MemberRole } from "@/lib/generated/prisma/browser";
import type { ServerWithMembersWithProfiles } from "@/lib/types";
import { useModal } from "@/hooks/use-modal-store";
import { ActionTooltip } from "@/components/action-tooltip";

interface ServerSectionProps {
	label: string;
	role?: MemberRole;
	sectionType: "channels" | "members";
	channelType?: ChannelType;
	server?: ServerWithMembersWithProfiles;
}

/**
 * Sidebar section heading ("Text channels", "Members", ...) with a
 * role-gated action: create channel for moderators, manage members for the
 * admin.
 */
export const ServerSection = ({
	label,
	role,
	sectionType,
	channelType,
	server,
}: ServerSectionProps) => {
	const { onOpen } = useModal();

	return (
		<div className="flex items-center justify-between py-2">
			<p className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
				{label}
			</p>
			{role !== MemberRole.GUEST && sectionType === "channels" && (
				<ActionTooltip label="Create channel" side="top">
					<button
						onClick={() => onOpen("createChannel", { channelType })}
						className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
					>
						<Plus className="h-4 w-4" />
					</button>
				</ActionTooltip>
			)}
			{role === MemberRole.ADMIN && sectionType === "members" && (
				<ActionTooltip label="Manage members" side="top">
					<button
						onClick={() => onOpen("members", { server })}
						className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
					>
						<Settings className="h-4 w-4" />
					</button>
				</ActionTooltip>
			)}
		</div>
	);
};
