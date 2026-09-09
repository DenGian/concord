"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

/** Confirmation dialog before leaving a server (non-owners only). */
export const LeaveServerModal = () => {
	const { isOpen, onClose, type, data } = useModal();
	const router = useRouter();

	const isModalOpen = isOpen && type === "leaveServer";
	const { server } = data;

	const [isLoading, setIsLoading] = useState(false);

	const onConfirm = async () => {
		try {
			setIsLoading(true);
			const res = await fetch(`/api/servers/${server?.id}/leave`, { method: "PATCH" });
			if (!res.ok) {
				throw new Error(`Failed to leave server (${res.status})`);
			}

			onClose();
			router.refresh();
			router.push("/");
		} catch (error) {
			console.error("[LEAVE_SERVER_MODAL]", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={isModalOpen} onOpenChange={onClose}>
			<DialogContent className="bg-white text-black p-0 overflow-hidden">
				<DialogHeader className="pt-8 px-6">
					<DialogTitle className="text-2xl text-center font-bold">Leave server</DialogTitle>
					<DialogDescription className="text-center text-zinc-500">
						Are you sure you want to leave{" "}
						<span className="font-semibold text-indigo-500">{server?.name}</span>?
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
