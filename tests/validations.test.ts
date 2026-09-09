import { describe, expect, it } from "vitest";

import {
	chatMessageSchema,
	channelSchema,
	fileMessageSchema,
	messageSchema,
	serverSchema,
} from "@/lib/validations";

describe("serverSchema", () => {
	it("accepts a valid server", () => {
		const result = serverSchema.safeParse({
			name: "My server",
			imageUrl: "https://example.ufs.sh/f/abc",
		});
		expect(result.success).toBe(true);
	});

	it("trims and rejects empty names", () => {
		expect(serverSchema.safeParse({ name: "   ", imageUrl: "x" }).success).toBe(false);
		expect(serverSchema.safeParse({ name: "", imageUrl: "x" }).success).toBe(false);
	});

	it("rejects a missing image", () => {
		expect(serverSchema.safeParse({ name: "ok", imageUrl: "" }).success).toBe(false);
	});

	it("rejects names over 100 characters", () => {
		expect(
			serverSchema.safeParse({ name: "a".repeat(101), imageUrl: "x" }).success,
		).toBe(false);
	});
});

describe("channelSchema", () => {
	it("accepts a valid channel", () => {
		const result = channelSchema.safeParse({ name: "memes", type: "TEXT" });
		expect(result.success).toBe(true);
	});

	it('rejects the reserved name "general" in any casing', () => {
		expect(channelSchema.safeParse({ name: "general", type: "TEXT" }).success).toBe(false);
		expect(channelSchema.safeParse({ name: "GeNeRaL", type: "TEXT" }).success).toBe(false);
	});

	it("rejects unknown channel types", () => {
		expect(channelSchema.safeParse({ name: "memes", type: "VOICE" }).success).toBe(false);
	});
});

describe("messageSchema", () => {
	it("accepts non-empty content", () => {
		expect(messageSchema.safeParse({ content: "hello" }).success).toBe(true);
	});

	it("rejects empty or whitespace-only content", () => {
		expect(messageSchema.safeParse({ content: "" }).success).toBe(false);
		expect(messageSchema.safeParse({ content: "   " }).success).toBe(false);
	});
});

describe("fileMessageSchema", () => {
	it("accepts a typed UploadThing attachment", () => {
		expect(
			fileMessageSchema.safeParse({
				fileUrl: "https://example.ufs.sh/f/1",
				fileType: "application/pdf",
			}).success,
		).toBe(true);
	});

	it("rejects a missing attachment", () => {
		expect(fileMessageSchema.safeParse({ fileUrl: "" }).success).toBe(false);
	});

	it("rejects URLs outside UploadThing", () => {
		expect(
			fileMessageSchema.safeParse({
				fileUrl: "javascript:alert(1)",
				fileType: "application/pdf",
			}).success,
		).toBe(false);
	});
});

describe("chatMessageSchema", () => {
	it("accepts text or a typed UploadThing attachment", () => {
		expect(chatMessageSchema.safeParse({ content: "hello" }).success).toBe(true);
		expect(
			chatMessageSchema.safeParse({
				fileUrl: "https://example.ufs.sh/f/1",
				fileType: "image/png",
			}).success,
		).toBe(true);
	});

	it("rejects incomplete and unsupported attachments", () => {
		expect(
			chatMessageSchema.safeParse({
				fileUrl: "https://example.ufs.sh/f/1",
			}).success,
		).toBe(false);
		expect(
			chatMessageSchema.safeParse({
				fileUrl: "https://example.ufs.sh/f/1",
				fileType: "text/html",
			}).success,
		).toBe(false);
	});
});
