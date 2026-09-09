"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

interface ChatQueryProps {
	/** Cache key, shared with useChatRealtime (e.g. `chat:<channelId>`). */
	queryKey: string;
	/** History endpoint: /api/messages or /api/direct-messages. */
	apiUrl: string;
	/** Name of the id query param the endpoint expects. */
	paramKey: "channelId" | "conversationId";
	paramValue: string;
	/**
	 * Poll while the realtime stream is down so messages still arrive
	 * (slower); disabled when SSE is connected.
	 */
	isConnected: boolean;
}

/**
 * Infinite, cursor-paginated message history. Pages arrive newest-first;
 * `fetchNextPage` loads older history as the user scrolls up.
 */
export const useChatQuery = ({
	queryKey,
	apiUrl,
	paramKey,
	paramValue,
	isConnected,
}: ChatQueryProps) => {
	const fetchMessages = async ({ pageParam }: { pageParam?: string }) => {
		const params = new URLSearchParams({ [paramKey]: paramValue });
		if (pageParam) {
			params.set("cursor", pageParam);
		}

		const res = await fetch(`${apiUrl}?${params.toString()}`);
		if (!res.ok) {
			throw new Error(`Failed to load messages (${res.status})`);
		}
		return res.json();
	};

	return useInfiniteQuery({
		queryKey: [queryKey],
		queryFn: fetchMessages,
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
		refetchInterval: isConnected ? false : 5000,
	});
};
