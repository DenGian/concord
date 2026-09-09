import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the database module before importing the unit under test.
vi.mock("@/lib/db", () => ({
	db: {
		conversation: {
			findUnique: vi.fn(),
			create: vi.fn(),
		},
	},
}));

import { db } from "@/lib/db";
import { getOrCreateConversation } from "@/lib/conversation";

const findUnique = vi.mocked(db.conversation.findUnique);
const create = vi.mocked(db.conversation.create);

const conversation = { id: "c1", memberOneId: "a", memberTwoId: "b" };

beforeEach(() => {
	vi.resetAllMocks();
});

describe("getOrCreateConversation", () => {
	it("returns an existing conversation stored as (a, b)", async () => {
		findUnique.mockResolvedValueOnce(conversation as never);

		const result = await getOrCreateConversation("a", "b");

		expect(result).toEqual(conversation);
		expect(findUnique).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { memberOneId_memberTwoId: { memberOneId: "a", memberTwoId: "b" } },
			}),
		);
		expect(create).not.toHaveBeenCalled();
	});

	it("canonicalizes a reversed caller order", async () => {
		findUnique.mockResolvedValueOnce(conversation as never);

		const result = await getOrCreateConversation("b", "a");

		expect(result).toEqual(conversation);
		expect(findUnique).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { memberOneId_memberTwoId: { memberOneId: "a", memberTwoId: "b" } },
			}),
		);
		expect(create).not.toHaveBeenCalled();
	});

	it("creates the conversation on first contact", async () => {
		findUnique.mockResolvedValue(null as never);
		create.mockResolvedValueOnce(conversation as never);

		const result = await getOrCreateConversation("a", "b");

		expect(result).toEqual(conversation);
		expect(create).toHaveBeenCalledTimes(1);
		expect(create).toHaveBeenCalledWith(
			expect.objectContaining({ data: { memberOneId: "a", memberTwoId: "b" } }),
		);
	});

	it("falls back to lookup when concurrent creation hits the unique constraint", async () => {
		findUnique
			.mockResolvedValueOnce(null as never) // initial lookup
			.mockResolvedValueOnce(conversation as never); // post-error re-read
		create.mockRejectedValueOnce(new Error("Unique constraint failed"));

		const result = await getOrCreateConversation("a", "b");

		expect(result).toEqual(conversation);
	});
});
