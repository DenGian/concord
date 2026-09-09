"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { MessageWithMemberWithProfile } from "@/lib/types";

interface ChatRealtimeProps {
	/** Hub key to subscribe to, e.g. `channel:<id>` or `conversation:<id>`. */
	realtimeKey: string;
	/** TanStack Query cache key used by useChatQuery for the same chat. */
	queryKey: string;
}

type MessagesPage = {
	items: MessageWithMemberWithProfile[];
	nextCursor: string | null;
};

type MessagesData = { pages: MessagesPage[]; pageParams: unknown[] };

/**
 * Subscribes to the chat's Server-Sent Events stream (/api/realtime) and
 * applies incoming events directly to the TanStack Query cache:
 *
 *  - "message:new"    → prepended to the first (newest) page
 *  - "message:update" → replaces the matching message in place
 *
 * Returns `isConnected` so the chat can fall back to polling while the
 * stream is down (EventSource reconnects automatically).
 */
export const useChatRealtime = ({ realtimeKey, queryKey }: ChatRealtimeProps) => {
	const queryClient = useQueryClient();
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		const source = new EventSource(
			`/api/realtime?key=${encodeURIComponent(realtimeKey)}`,
		);

		source.onopen = () => setIsConnected(true);
		source.onerror = () => setIsConnected(false);

		source.addEventListener("message:new", (event: MessageEvent) => {
			const message: MessageWithMemberWithProfile = JSON.parse(event.data);

			queryClient.setQueryData<MessagesData>([queryKey], (oldData) => {
				if (!oldData || oldData.pages.length === 0) {
					return {
						pages: [{ items: [message], nextCursor: null }],
						pageParams: [undefined],
					};
				}

				const [first, ...rest] = oldData.pages;

				// Guard against receiving our own optimistic refetch twice.
				if (first.items.some((item) => item.id === message.id)) {
					return oldData;
				}

				return {
					...oldData,
					pages: [{ ...first, items: [message, ...first.items] }, ...rest],
				};
			});
		});

		source.addEventListener("message:update", (event: MessageEvent) => {
			const message: MessageWithMemberWithProfile = JSON.parse(event.data);

			queryClient.setQueryData<MessagesData>([queryKey], (oldData) => {
				if (!oldData) return oldData;

				return {
					...oldData,
					pages: oldData.pages.map((page) => ({
						...page,
						items: page.items.map((item) =>
							item.id === message.id ? message : item,
						),
					})),
				};
			});
		});

		return () => {
			source.close();
			setIsConnected(false);
		};
	}, [realtimeKey, queryKey, queryClient]);

	return { isConnected };
};
