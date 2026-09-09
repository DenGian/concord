"use client";

import { useEffect, useState, type RefObject } from "react";

interface ChatScrollProps {
	/** The scrollable message container. */
	chatRef: RefObject<HTMLDivElement | null>;
	/** Sentinel div at the bottom of the message list. */
	bottomRef: RefObject<HTMLDivElement | null>;
	/** Called when the user scrolls near the top (load older messages). */
	loadMore: () => void;
	shouldLoadMore: boolean;
	/** Message count, used to react to new messages arriving. */
	count: number;
}

/**
 * Chat scrolling behaviour:
 *  - reaching the top of the container triggers `loadMore`
 *  - the view auto-scrolls to the bottom on first load, and afterwards only
 *    when the user is already near the bottom (so reading history is never
 *    interrupted by new messages).
 */
export const useChatScroll = ({
	chatRef,
	bottomRef,
	loadMore,
	shouldLoadMore,
	count,
}: ChatScrollProps) => {
	const [hasInitialized, setHasInitialized] = useState(false);

	useEffect(() => {
		const topDiv = chatRef?.current;

		const handleScroll = () => {
			if (topDiv && topDiv.scrollTop === 0 && shouldLoadMore) {
				loadMore();
			}
		};

		topDiv?.addEventListener("scroll", handleScroll);
		return () => topDiv?.removeEventListener("scroll", handleScroll);
	}, [shouldLoadMore, loadMore, chatRef]);

	useEffect(() => {
		const bottomDiv = bottomRef?.current;
		const topDiv = chatRef?.current;

		const shouldAutoScroll = () => {
			if (!hasInitialized && bottomDiv) {
				setHasInitialized(true);
				return true;
			}
			if (!topDiv) {
				return false;
			}
			const distanceFromBottom =
				topDiv.scrollHeight - topDiv.scrollTop - topDiv.clientHeight;
			return distanceFromBottom <= 100;
		};

		if (shouldAutoScroll()) {
			setTimeout(() => {
				bottomDiv?.scrollIntoView({ behavior: "smooth" });
			}, 100);
		}
	}, [bottomRef, chatRef, count, hasInitialized]);
};
