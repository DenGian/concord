"use client";

import {
	ChevronDown,
	LogOut,
	PlusCircle,
	Settings,
	Trash,
	UserPlus,
	Users,
} from "lucide-react";

import { MemberRole } from "@/lib/generated/prisma/browser";
import type { ServerWithMembersWithProfiles } from "@/lib/types";
import { useModal } from "@/hooks/use-modal-store";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ServerHeaderProps {
	server: ServerWithMembersWithProfiles;
	role?: MemberRole;
}

/**
 * Server name bar with the action dropdown. Items are filtered by role:
 * moderators can invite and manage channels, the admin can additionally
 * edit/delete the server and manage members; guests can only leave.
 */
export const ServerHeader = ({ server, role }: ServerHeaderProps) => {
	const { onOpen } = useModal();

	const isAdmin = role === MemberRole.ADMIN;
	const isModerator = isAdmin || role === MemberRole.MODERATOR;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className="w-full text-base font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2 hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition">
					{server.name}
					<ChevronDown className="h-5 w-5 ml-auto" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56 text-xs font-medium text-black dark:text-neutral-400 space-y-[2px]">
				{isModerator && (
					<DropdownMenuItem
						onClick={() => onOpen("invite", { server })}
						className="text-indigo-600 dark:text-indigo-400 px-3 py-2 text-sm cursor-pointer"
					>
						Invite people
						<UserPlus className="h-4 w-4 ml-auto" />
					</DropdownMenuItem>
				)}
				{isAdmin && (
					<DropdownMenuItem
						onClick={() => onOpen("editServer", { server })}
						className="px-3 py-2 text-sm cursor-pointer"
					>
						Server settings
						<Settings className="h-4 w-4 ml-auto" />
					</DropdownMenuItem>
				)}
				{isAdmin && (
					<DropdownMenuItem
						onClick={() => onOpen("members", { server })}
						className="px-3 py-2 text-sm cursor-pointer"
					>
						Manage members
						<Users className="h-4 w-4 ml-auto" />
					</DropdownMenuItem>
				)}
				{isModerator && (
					<DropdownMenuItem
						onClick={() => onOpen("createChannel", { server })}
						className="px-3 py-2 text-sm cursor-pointer"
					>
						Create channel
						<PlusCircle className="h-4 w-4 ml-auto" />
					</DropdownMenuItem>
				)}
				{isModerator && <DropdownMenuSeparator />}
				{isAdmin && (
					<DropdownMenuItem
						onClick={() => onOpen("deleteServer", { server })}
						className="text-rose-500 px-3 py-2 text-sm cursor-pointer"
					>
						Delete server
						<Trash className="h-4 w-4 ml-auto" />
					</DropdownMenuItem>
				)}
				{!isAdmin && (
					<DropdownMenuItem
						onClick={() => onOpen("leaveServer", { server })}
						className="text-rose-500 px-3 py-2 text-sm cursor-pointer"
					>
						Leave server
						<LogOut className="h-4 w-4 ml-auto" />
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
