import { db } from "@/lib/db";
import { publicProfileSelect } from "@/lib/types";

/**
 * Finds the 1:1 conversation between two members, creating it on first
 * contact. Member ids are sorted so every pair has one canonical database
 * representation, even when both participants open the chat concurrently.
 */
export const getOrCreateConversation = async (
	memberOneId: string,
	memberTwoId: string,
) => {
	// Store every pair in a stable order. Besides simplifying lookups, this
	// prevents simultaneous A→B and B→A requests from creating two rows.
	const [firstId, secondId] = [memberOneId, memberTwoId].sort();
	const existing = await findConversation(firstId, secondId);

	if (existing) {
		return existing;
	}

	return createNewConversation(firstId, secondId);
};

const conversationInclude = {
	memberOne: { include: { profile: { select: publicProfileSelect } } },
	memberTwo: { include: { profile: { select: publicProfileSelect } } },
} as const;

const findConversation = async (memberOneId: string, memberTwoId: string) => {
	return db.conversation.findUnique({
		where: {
			memberOneId_memberTwoId: { memberOneId, memberTwoId },
		},
		include: conversationInclude,
	});
};

const createNewConversation = async (
	memberOneId: string,
	memberTwoId: string,
) => {
	try {
		return await db.conversation.create({
			data: { memberOneId, memberTwoId },
			include: conversationInclude,
		});
	} catch {
		// A concurrent request may have created the conversation in the
		// meantime; the unique constraint guarantees there is exactly one,
		// so fall back to reading it.
		return findConversation(memberOneId, memberTwoId);
	}
};
