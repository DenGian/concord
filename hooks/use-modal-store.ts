import { create } from "zustand";

import type { Channel, ChannelType, Server } from "@/lib/generated/prisma/browser";

/**
 * Every modal in the app is registered here and rendered once by
 * `components/providers/modal-provider.tsx`. Any component can open one via
 * `useModal().onOpen(type, data)` instead of managing its own dialog state.
 */
export type ModalType =
	| "createServer"
	| "editServer"
	| "invite"
	| "members"
	| "createChannel"
	| "editChannel"
	| "deleteChannel"
	| "leaveServer"
	| "deleteServer"
	| "messageFile"
	| "deleteMessage";

/** Context a modal may need; each modal reads only the fields it uses. */
interface ModalData {
	server?: Server;
	channel?: Channel;
	channelType?: ChannelType;
	/** For message modals: the endpoint to call (e.g. /api/messages/123). */
	apiUrl?: string;
	/** For message modals: query params the endpoint needs. */
	query?: Record<string, string>;
}

interface ModalStore {
	type: ModalType | null;
	data: ModalData;
	isOpen: boolean;
	onOpen: (type: ModalType, data?: ModalData) => void;
	onClose: () => void;
}

export const useModal = create<ModalStore>((set) => ({
	type: null,
	data: {},
	isOpen: false,
	onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
	onClose: () => set({ type: null, isOpen: false }),
}));
