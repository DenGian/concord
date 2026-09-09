import type {
	Member,
	Message,
	Profile,
	Server,
} from "@/lib/generated/prisma/browser";

/** Profile fields safe to serialize to other members. */
export type PublicProfile = Pick<Profile, "id" | "name" | "imageUrl">;

/** Prisma selection matching PublicProfile; excludes private email/user ids. */
export const publicProfileSelect = {
	id: true,
	name: true,
	imageUrl: true,
} as const;

/** A server with its members and each member's profile eagerly loaded. */
export type ServerWithMembersWithProfiles = Server & {
	members: (Member & { profile: PublicProfile })[];
};

/** A chat message with its author (member + profile) eagerly loaded. */
export type MessageWithMemberWithProfile = Message & {
	member: Member & { profile: PublicProfile };
};
