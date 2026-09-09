"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Edit, FileIcon, ShieldAlert, ShieldCheck, Trash } from "lucide-react";

import {
	MemberRole,
	type Member,
} from "@/lib/generated/prisma/browser";
import { cn } from "@/lib/utils";
import type { PublicProfile } from "@/lib/types";
import { messageSchema, type MessageInput } from "@/lib/validations";
import { useModal } from "@/hooks/use-modal-store";
import { UserAvatar } from "@/components/user-avatar";
import { ActionTooltip } from "@/components/action-tooltip";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatItemProps {
	id: string;
	content: string;
	member: Member & { profile: PublicProfile };
	timestamp: string;
	fileUrl: string | null;
	fileType: string | null;
	deleted: boolean;
	/** The member viewing the chat (permissions are derived from it). */
	currentMember: Member;
	isUpdated: boolean;
	/** Endpoint for editing/deleting this message. */
	socketUrl: string;
	socketQuery: Record<string, string>;
}

const roleIconMap = {
	[MemberRole.GUEST]: null,
	[MemberRole.MODERATOR]: <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />,
	[MemberRole.ADMIN]: <ShieldAlert className="h-4 w-4 ml-2 text-rose-500" />,
};

/**
 * A single message row: author, timestamp, content (text, image or PDF),
 * inline editing for the author and delete for author/moderators.
 */
export const ChatItem = ({
	id,
	content,
	member,
	timestamp,
	fileUrl,
	fileType,
	deleted,
	currentMember,
	isUpdated,
	socketUrl,
	socketQuery,
}: ChatItemProps) => {
	const [isEditing, setIsEditing] = useState(false);
	const { onOpen } = useModal();
	const params = useParams();
	const router = useRouter();

	const onMemberClick = () => {
		if (member.id === currentMember.id) {
			return;
		}
		router.push(`/servers/${params?.serverId}/conversations/${member.id}`);
	};

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsEditing(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const form = useForm<MessageInput>({
		resolver: zodResolver(messageSchema),
		defaultValues: { content },
	});

	useEffect(() => {
		form.reset({ content });
	}, [form, content]);

	const isLoading = form.formState.isSubmitting;

	const onSubmit = async (values: MessageInput) => {
		try {
			const queryString = new URLSearchParams(socketQuery).toString();
			const res = await fetch(`${socketUrl}/${id}?${queryString}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values),
			});
			if (!res.ok) {
				throw new Error(`Failed to edit message (${res.status})`);
			}

			form.reset();
			setIsEditing(false);
		} catch (error) {
			console.error("[CHAT_ITEM_EDIT]", error);
		}
	};

	const isAdmin = currentMember.role === MemberRole.ADMIN;
	const isModerator = currentMember.role === MemberRole.MODERATOR;
	const isOwner = currentMember.id === member.id;
	const canDeleteMessage = !deleted && (isAdmin || isModerator || isOwner);
	const canEditMessage = !deleted && isOwner && !fileUrl;
	const isPdf = fileType === "application/pdf";
	const isImage = !!fileUrl && !isPdf;

	return (
		<div className="relative group flex items-center hover:bg-black/5 p-4 transition w-full">
			<div className="group flex gap-x-2 items-start w-full">
				<button
					onClick={onMemberClick}
					className="cursor-pointer hover:drop-shadow-md transition"
				>
					<UserAvatar src={member.profile.imageUrl} name={member.profile.name} />
				</button>
				<div className="flex flex-col w-full">
					<div className="flex items-center gap-x-2">
						<div className="flex items-center">
							<button
								onClick={onMemberClick}
								className="font-semibold text-sm hover:underline cursor-pointer"
							>
								{member.profile.name}
							</button>
							<ActionTooltip label={member.role}>
								{roleIconMap[member.role]}
							</ActionTooltip>
						</div>
						<span className="text-xs text-zinc-500 dark:text-zinc-400">
							{timestamp}
						</span>
					</div>
					{isImage && (
						<a
							href={fileUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="relative aspect-square rounded-md mt-2 overflow-hidden border flex items-center bg-secondary h-48 w-48"
						>
							<Image src={fileUrl} alt={content || "Attachment"} fill className="object-cover" />
						</a>
					)}
					{fileUrl && isPdf && (
						<div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
							<FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
							<a
								href={fileUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
							>
								PDF attachment
							</a>
						</div>
					)}
					{!fileUrl && !isEditing && (
						<p
							className={cn(
								"text-sm text-zinc-600 dark:text-zinc-300",
								deleted && "italic text-zinc-500 dark:text-zinc-400 text-xs mt-1"
							)}
						>
							{content}
							{isUpdated && !deleted && (
								<span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400">
									(edited)
								</span>
							)}
						</p>
					)}
					{!fileUrl && isEditing && (
						<Form {...form}>
							<form
								className="flex items-center w-full gap-x-2 pt-2"
								onSubmit={form.handleSubmit(onSubmit)}
							>
								<FormField
									control={form.control}
									name="content"
									render={({ field }) => (
										<FormItem className="flex-1">
											<FormControl>
												<div className="relative w-full">
													<Input
														disabled={isLoading}
														className="p-2 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
														placeholder="Edited message"
														autoComplete="off"
														{...field}
													/>
												</div>
											</FormControl>
										</FormItem>
									)}
								/>
								<Button disabled={isLoading} size="sm" variant="primary">
									Save
								</Button>
							</form>
							<span className="text-[10px] mt-1 text-zinc-400">
								Press escape to cancel, enter to save
							</span>
						</Form>
					)}
				</div>
			</div>
			{canDeleteMessage && (
				<div className="hidden group-hover:flex items-center gap-x-2 absolute p-1 -top-2 right-5 bg-white dark:bg-zinc-800 border rounded-sm">
					{canEditMessage && (
						<ActionTooltip label="Edit">
							<Edit
								onClick={() => setIsEditing(true)}
								className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
							/>
						</ActionTooltip>
					)}
					<ActionTooltip label="Delete">
						<Trash
							onClick={() =>
								onOpen("deleteMessage", {
									apiUrl: `${socketUrl}/${id}`,
									query: socketQuery,
								})
							}
							className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
						/>
					</ActionTooltip>
				</div>
			)}
		</div>
	);
};
