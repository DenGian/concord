"use client";

import { useState } from "react";

import { useModal } from "@/hooks/use-modal-store";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Confirmation dialog before deleting a message. The chat item passes the
 * exact endpoint + query via modal data; the UI updates through the
 * realtime "message:update" event, so no refresh is needed here.
 */
export const DeleteMessageModal = () => {
	const { isOpen, onClose, type, data } = useModal();

	const isModalOpen = isOpen && type === "deleteMessage";
	const { apiUrl, query } = data;

	const [isLoading, setIsLoading] = useState(false);

	const onConfirm = async () => {
		try {
			setIsLoading(true);
			const params = new URLSearchParams(query ?? {});
			const res = await fetch(`${apiUrl}?${params.toString()}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				throw new Error(`Failed to delete message (${res.status})`);
			}

			onClose();
		} catch (error) {
			console.error("[DELETE_MESSAGE_MODAL]", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={isModalOpen} onOpenChange={onClose}>
			<DialogContent className="bg-white text-black p-0 overflow-hidden">
				<DialogHeader className="pt-8 px-6">
					<DialogTitle className="text-2xl text-center font-bold">Delete message</DialogTitle>
					<DialogDescription className="text-center text-zinc-500">
						Are you sure you want to do this? <br />
						The message will be permanently deleted.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="bg-gray-100 px-6 py-4">
					<div className="flex items-center justify-between w-full">
						<Button disabled={isLoading} onClick={onClose} variant="ghost">
							Cancel
						</Button>
						<Button disabled={isLoading} onClick={onConfirm} variant="primary">
							Confirm
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
