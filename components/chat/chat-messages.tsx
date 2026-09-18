"use client";

import { Fragment, useRef } from "react";
import { format } from "date-fns";
import { Loader2, ServerCrash } from "lucide-react";

import type { Member } from "@/lib/generated/prisma/browser";
import type { MessageWithMemberWithProfile } from "@/lib/types";
import { useChatQuery } from "@/hooks/use-chat-query";
import { useChatRealtime } from "@/hooks/use-chat-realtime";
import { useChatScroll } from "@/hooks/use-chat-scroll";

import { ChatWelcome } from "./chat-welcome";
import { ChatItem } from "./chat-item";

const DATE_FORMAT = "d MMM yyyy, HH:mm";

interface ChatMessagesProps {
	name: string;
	member: Member;
	chatId: string;
	/** History endpoint (GET). */
	apiUrl: string;
	/** Mutation endpoint base (POST/PATCH/DELETE). */
	mutationUrl: string;
	mutationQuery: Record<string, string>;
	paramKey: "channelId" | "conversationId";
	paramValue: string;
	type: "channel" | "conversation";
}

/**
 * The scrollable message list. History is fetched in pages via TanStack
 * Query (cursor pagination, newest first); live updates are pushed into the
 * same cache by the SSE subscription in useChatRealtime. While the stream
 * is down, the query falls back to polling.
 */
export const ChatMessages = ({
	name,
	member,
	chatId,
	apiUrl,
	mutationUrl,
	mutationQuery,
	paramKey,
	paramValue,
	type,
}: ChatMessagesProps) => {
	const queryKey = `chat:${chatId}`;
	const realtimeKey = `${type === "channel" ? "channel" : "conversation"}:${paramValue}`;

	const chatRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);

	const { isConnected } = useChatRealtime({ realtimeKey, queryKey });
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
		useChatQuery({
			queryKey,
			apiUrl,
			paramKey,
			paramValue,
			isConnected,
		});

	const messageCount =
		data?.pages?.reduce(
			(total: number, page: { items: unknown[] }) => total + page.items.length,
			0,
		) ?? 0;

	useChatScroll({
		chatRef,
		bottomRef,
		loadMore: fetchNextPage,
		shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
		count: messageCount,
	});

	if (status === "pending") {
		return (
			<div className="flex flex-col flex-1 justify-center items-center">
				<Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
				<p className="text-xs text-zinc-500 dark:text-zinc-400">
					Loading messages...
				</p>
			</div>
		);
	}

	if (status === "error") {
		return (
			<div className="flex flex-col flex-1 justify-center items-center">
				<ServerCrash className="h-7 w-7 text-zinc-500 my-4" />
				<p className="text-xs text-zinc-500 dark:text-zinc-400">
					Something went wrong!
				</p>
			</div>
		);
	}

	return (
		<div ref={chatRef} className="flex-1 flex flex-col py-4 overflow-y-auto">
			{!hasNextPage && <div className="flex-1" />}
			{!hasNextPage && <ChatWelcome type={type} name={name} />}
			{hasNextPage && (
				<div className="flex justify-center">
					{isFetchingNextPage ? (
						<Loader2 className="h-6 w-6 text-zinc-500 animate-spin my-4" />
					) : (
						<button
							onClick={() => fetchNextPage()}
							className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 text-xs my-4 dark:hover:text-zinc-300 transition"
						>
							Load previous messages
						</button>
					)}
				</div>
			)}
			<div className="flex flex-col-reverse mt-auto">
				{data?.pages?.map((page: { items: MessageWithMemberWithProfile[] }, i: number) => (
					<Fragment key={i}>
						{page.items.map((message) => (
							<ChatItem
								key={message.id}
								id={message.id}
								currentMember={member}
								member={message.member}
								content={message.content}
								fileUrl={message.fileUrl}
								fileType={message.fileType}
								deleted={message.deleted}
								timestamp={format(new Date(message.createdAt), DATE_FORMAT)}
								isUpdated={message.updatedAt !== message.createdAt}
								mutationUrl={mutationUrl}
								mutationQuery={mutationQuery}
							/>
						))}
					</Fragment>
				))}
			</div>
			<div ref={bottomRef} />
		</div>
	);
};
