/**
 * In-process realtime hub.
 *
 * Chat updates are pushed to browsers over Server-Sent Events (see
 * app/api/realtime/route.ts). This hub is the server-side half: API routes
 * `publish()` an event for a key, and every open SSE stream subscribed to
 * that key receives it.
 *
 * Keys are namespaced strings:
 *   channel:<channelId>           — events for a server text channel
 *   conversation:<conversationId> — events for a 1:1 conversation
 *
 * Note: the hub lives in process memory, which is perfect for a single
 * Node.js server (and for `next dev`). If you scale to multiple instances,
 * replace this module with a shared broker (e.g. Redis pub/sub) — the
 * publish/subscribe API can stay identical.
 */

export type RealtimeEvent = {
	/** Event name, e.g. "message:new" or "message:update". */
	event: string;
	/** JSON-serializable payload delivered to the browser. */
	data: unknown;
};

type Listener = (event: RealtimeEvent) => void;

export class RealtimeHub {
	private listeners = new Map<string, Set<Listener>>();

	/**
	 * Subscribe to all events published for `key`.
	 * Returns an unsubscribe function.
	 */
	subscribe(key: string, listener: Listener): () => void {
		let set = this.listeners.get(key);
		if (!set) {
			set = new Set();
			this.listeners.set(key, set);
		}
		set.add(listener);

		return () => {
			set.delete(listener);
			if (set.size === 0) {
				this.listeners.delete(key);
			}
		};
	}

	/** Publish an event to every subscriber of `key`. */
	publish(key: string, event: string, data: unknown): void {
		const set = this.listeners.get(key);
		if (!set) return;

		for (const listener of set) {
			listener({ event, data });
		}
	}

	/** Number of active subscribers for `key` (used by tests/diagnostics). */
	subscriberCount(key: string): number {
		return this.listeners.get(key)?.size ?? 0;
	}
}

// Survive Next.js dev-mode module reloads the same way lib/db.ts does:
// a hub recreated on hot reload would silently drop existing subscriptions.
const globalForRealtime = globalThis as unknown as { realtimeHub?: RealtimeHub };

export const realtimeHub = globalForRealtime.realtimeHub ?? new RealtimeHub();

if (process.env.NODE_ENV !== "production") {
	globalForRealtime.realtimeHub = realtimeHub;
}

/** Realtime key for a server text channel. */
export const channelKey = (channelId: string) => `channel:${channelId}`;

/** Realtime key for a 1:1 conversation. */
export const conversationKey = (conversationId: string) =>
	`conversation:${conversationId}`;
