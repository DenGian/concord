"use client";

import { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import { Loader2 } from "lucide-react";

import "@livekit/components-styles";

interface MediaRoomProps {
	/** LiveKit room name (we use the channel / conversation id). */
	chatId: string;
	video: boolean;
	audio: boolean;
}

/**
 * Audio/video room backed by LiveKit. Fetches a join token from
 * /api/livekit, then renders the prebuilt conference UI.
 *
 * LiveKit is optional: when the env vars are missing the token endpoint
 * returns 503 and we show a hint instead of a broken room.
 */
export const MediaRoom = ({ chatId, video, audio }: MediaRoomProps) => {
	const [token, setToken] = useState("");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		(async () => {
			try {
				const res = await fetch(`/api/livekit?room=${encodeURIComponent(chatId)}`);
				if (!res.ok) {
					throw new Error(
						res.status === 503
							? "Audio/video is not configured on this server (missing LiveKit credentials)."
							: `Could not join the room (${res.status}).`,
					);
				}
				const data = await res.json();
				if (!cancelled) setToken(data.token);
			} catch (e) {
				if (!cancelled) setError(e instanceof Error ? e.message : "Could not join the room.");
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [chatId]);

	if (error) {
		return (
			<div className="flex flex-col flex-1 justify-center items-center px-4 text-center">
				<p className="text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
			</div>
		);
	}

	if (token === "") {
		return (
			<div className="flex flex-col flex-1 justify-center items-center">
				<Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
				<p className="text-xs text-zinc-500 dark:text-zinc-400">Loading...</p>
			</div>
		);
	}

	return (
		<LiveKitRoom
			data-lk-theme="default"
			serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
			token={token}
			connect={true}
			video={video}
			audio={audio}
		>
			<VideoConference />
		</LiveKitRoom>
	);
};
