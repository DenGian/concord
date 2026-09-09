import { describe, expect, it, vi } from "vitest";

import {
	channelKey,
	conversationKey,
	RealtimeHub,
	type RealtimeEvent,
} from "@/lib/realtime";

describe("RealtimeHub", () => {
	it("delivers published events to subscribers of the same key", () => {
		const hub = new RealtimeHub();
		const received: RealtimeEvent[] = [];

		hub.subscribe("channel:1", (event) => received.push(event));
		hub.publish("channel:1", "message:new", { id: "m1" });

		expect(received).toEqual([{ event: "message:new", data: { id: "m1" } }]);
	});

	it("does not deliver events across keys", () => {
		const hub = new RealtimeHub();
		const listener = vi.fn();

		hub.subscribe("channel:1", listener);
		hub.publish("channel:2", "message:new", { id: "m1" });

		expect(listener).not.toHaveBeenCalled();
	});

	it("supports multiple subscribers per key", () => {
		const hub = new RealtimeHub();
		const a = vi.fn();
		const b = vi.fn();

		hub.subscribe("channel:1", a);
		hub.subscribe("channel:1", b);
		hub.publish("channel:1", "message:new", {});

		expect(a).toHaveBeenCalledTimes(1);
		expect(b).toHaveBeenCalledTimes(1);
	});

	it("stops delivering after unsubscribe and cleans up empty keys", () => {
		const hub = new RealtimeHub();
		const listener = vi.fn();

		const unsubscribe = hub.subscribe("channel:1", listener);
		expect(hub.subscriberCount("channel:1")).toBe(1);

		unsubscribe();
		hub.publish("channel:1", "message:new", {});

		expect(listener).not.toHaveBeenCalled();
		expect(hub.subscriberCount("channel:1")).toBe(0);
	});

	it("publishing to a key without subscribers is a no-op", () => {
		const hub = new RealtimeHub();
		expect(() => hub.publish("channel:none", "message:new", {})).not.toThrow();
	});
});

describe("realtime keys", () => {
	it("namespaces channel and conversation keys", () => {
		expect(channelKey("abc")).toBe("channel:abc");
		expect(conversationKey("abc")).toBe("conversation:abc");
	});
});
