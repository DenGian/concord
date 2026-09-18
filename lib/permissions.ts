import { MemberRole } from "@/lib/generated/prisma/browser";

/** Roles allowed to manage channels and rotate invite links. */
export const communityManagerRoles: MemberRole[] = [
	MemberRole.ADMIN,
	MemberRole.MODERATOR,
];

export const canManageCommunity = (role: MemberRole | undefined) =>
	role !== undefined && communityManagerRoles.includes(role);

/** Channel messages may be removed by their author or by community staff. */
export const canDeleteChannelMessage = (
	viewerRole: MemberRole,
	viewerMemberId: string,
	authorMemberId: string,
) => viewerMemberId === authorMemberId || canManageCommunity(viewerRole);
