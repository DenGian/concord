"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Video, VideoOff } from "lucide-react";

import { ActionTooltip } from "@/components/action-tooltip";

/**
 * Toggles a 1:1 video call by flipping the `?video=true` query param; the
 * conversation page renders a MediaRoom instead of the chat when it is set.
 */
export const ChatVideoButton = () => {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();

	const isVideo = searchParams?.get("video");

	const onClick = () => {
		const url = isVideo ? pathname : `${pathname}?video=true`;
		router.push(url ?? "");
	};

	const Icon = isVideo ? VideoOff : Video;
	const tooltipLabel = isVideo ? "End video call" : "Start video call";

	return (
		<ActionTooltip side="bottom" label={tooltipLabel}>
			<button onClick={onClick} className="hover:opacity-75 transition mr-4">
				<Icon className="h-6 w-6 text-zinc-500 dark:text-zinc-400" />
			</button>
		</ActionTooltip>
	);
};
