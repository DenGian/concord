"use client";

import { useSyncExternalStore } from "react";

import { CreateServerModal } from "@/components/modals/create-server-modal";
import { EditServerModal } from "@/components/modals/edit-server-modal";
import { InviteModal } from "@/components/modals/invite-modal";
import { MembersModal } from "@/components/modals/members-modal";
import { CreateChannelModal } from "@/components/modals/create-channel-modal";
import { EditChannelModal } from "@/components/modals/edit-channel-modal";
import { DeleteChannelModal } from "@/components/modals/delete-channel-modal";
import { LeaveServerModal } from "@/components/modals/leave-server-modal";
import { DeleteServerModal } from "@/components/modals/delete-server-modal";
import { MessageFileModal } from "@/components/modals/message-file-modal";
import { DeleteMessageModal } from "@/components/modals/delete-message-modal";

/**
 * Renders every modal exactly once, near the root of the tree. Which one is
 * visible is controlled by the zustand store in hooks/use-modal-store.ts.
 * Mounted client-side only to avoid SSR/client hydration mismatches for
 * portal-based dialogs.
 */
const emptySubscribe = () => () => {};

export const ModalProvider = () => {
	// true on the client, false during SSR/hydration — hydration-safe without
	// an effect + setState round-trip.
	const isMounted = useSyncExternalStore(
		emptySubscribe,
		() => true,
		() => false,
	);

	if (!isMounted) {
		return null;
	}

	return (
		<>
			<CreateServerModal />
			<EditServerModal />
			<InviteModal />
			<MembersModal />
			<CreateChannelModal />
			<EditChannelModal />
			<DeleteChannelModal />
			<LeaveServerModal />
			<DeleteServerModal />
			<MessageFileModal />
			<DeleteMessageModal />
		</>
	);
};
