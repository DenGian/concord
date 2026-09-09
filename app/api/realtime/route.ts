import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { ChannelType } from "@/lib/generated/prisma/browser";
import { realtimeHub, type RealtimeEvent } from "@/lib/realtime";

// SSE streams must never be statically optimized or cached.
export const dynamic = "force-dynamic";

/** Keep-alive comment interval; well under common 60s proxy idle timeouts. */
const HEARTBEAT_MS = 25_000;

/**
 * GET /api/realtime?key=channel:<id> | conversation:<id>
 *
 * Server-Sent Events stream for live chat updates. The browser subscribes
 * with a plain `EventSource`; API routes publish through `lib/realtime.ts`.
 *
 * SSE was chosen over WebSockets/Socket.IO because it works natively inside
 * a Next.js App Router route handler (no custom server needed), EventSource
 * reconnects automatically, and chat only needs server→client pushes —
 * client→server traffic already goes through regular POST endpoints.
 */
export async function GET(req: Request) {
	const profile = await currentProfile();
	if (!profile) {
		return new Response("Unauthorized", { status: 401 });
	}

	const key = new URL(req.url).searchParams.get("key");
	if (!key) {
		return new Response("Key missing", { status: 400 });
	}

	const allowed = await canSubscribe(key, profile.id);
	if (!allowed) {
		return new Response("Forbidden", { status: 403 });
	}

	const encoder = new TextEncoder();

	let unsubscribe: (() => void) | undefined;
	let heartbeat: ReturnType<typeof setInterval> | undefined;

	const stream = new ReadableStream({
		start(controller) {
			const send = ({ event, data }: RealtimeEvent) => {
				controller.enqueue(
					encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
				);
			};

			// Tell EventSource how quickly to reconnect after a drop.
			controller.enqueue(encoder.encode("retry: 3000\n\n"));

			unsubscribe = realtimeHub.subscribe(key, send);

			heartbeat = setInterval(() => {
				// SSE comment line — ignored by the browser, keeps proxies from
				// closing an otherwise idle connection.
				controller.enqueue(encoder.encode(": ping\n\n"));
			}, HEARTBEAT_MS);

			req.signal.addEventListener("abort", () => {
				unsubscribe?.();
				clearInterval(heartbeat);
				try {
					controller.close();
				} catch {
					// Already closed.
				}
			});
		},
		cancel() {
			unsubscribe?.();
			clearInterval(heartbeat);
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-store, no-transform",
			Connection: "keep-alive",
			// Disable buffering in nginx-style reverse proxies.
			"X-Accel-Buffering": "no",
		},
	});
}

/**
 * Authorization: a profile may subscribe to a channel only as a member of
 * its server, and to a conversation only as one of its two participants.
 */
async function canSubscribe(key: string, profileId: string): Promise<boolean> {
	const [namespace, id] = key.split(":");
	if (!id) return false;

	if (namespace === "channel") {
		const member = await db.member.findFirst({
			where: {
				profileId,
				server: { channels: { some: { id, type: ChannelType.TEXT } } },
			},
		});
		return Boolean(member);
	}

	if (namespace === "conversation") {
		const conversation = await db.conversation.findFirst({
			where: {
				id,
				OR: [
					{ memberOne: { profileId } },
					{ memberTwo: { profileId } },
				],
			},
		});
		return Boolean(conversation);
	}

	return false;
}
