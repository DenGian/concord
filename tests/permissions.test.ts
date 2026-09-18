import { describe, expect, it } from "vitest";

import { MemberRole } from "@/lib/generated/prisma/browser";
import {
	canDeleteChannelMessage,
	canManageCommunity,
} from "@/lib/permissions";

describe("community permissions", () => {
	it.each([MemberRole.ADMIN, MemberRole.MODERATOR])(
		"allows %s members to manage channels and invites",
		(role) => {
			expect(canManageCommunity(role)).toBe(true);
		},
	);

	it("does not grant management permissions to guests or missing members", () => {
		expect(canManageCommunity(MemberRole.GUEST)).toBe(false);
		expect(canManageCommunity(undefined)).toBe(false);
	});

	it("allows authors and community staff to delete channel messages", () => {
		expect(canDeleteChannelMessage(MemberRole.GUEST, "member-1", "member-1")).toBe(true);
		expect(canDeleteChannelMessage(MemberRole.MODERATOR, "member-1", "member-2")).toBe(true);
		expect(canDeleteChannelMessage(MemberRole.ADMIN, "member-1", "member-2")).toBe(true);
	});

	it("does not allow a guest to delete another member's message", () => {
		expect(canDeleteChannelMessage(MemberRole.GUEST, "member-1", "member-2")).toBe(false);
	});
});
