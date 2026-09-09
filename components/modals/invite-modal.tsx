"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";

import { useModal } from "@/hooks/use-modal-store";
import { useOrigin } from "@/hooks/use-origin";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Shows the server's invite link with copy-to-clipboard, and lets
 * moderators rotate the invite code (invalidating old links).
 */
export const InviteModal = () => {
	const { isOpen, onOpen, onClose, type, data } = useModal();
	const origin = useOrigin();

	const isModalOpen = isOpen && type === "invite";
	const { server } = data;

	const [copied, setCopied] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const inviteUrl = `${origin}/invite/${server?.inviteCode}`;

	const onCopy = () => {
		navigator.clipboard.writeText(inviteUrl);
		setCopied(true);

		setTimeout(() => setCopied(false), 1000);
	};

	const onNew = async () => {
		try {
			setIsLoading(true);
			const res = await fetch(`/api/servers/${server?.id}/invite-code`, {
				method: "PATCH",
			});
			if (!res.ok) {
				throw new Error(`Failed to regenerate invite code (${res.status})`);
			}
			const updated = await res.json();

			// Re-open with the fresh server so the link updates in place.
			onOpen("invite", { server: updated });
		} catch (error) {
			console.error("[INVITE_MODAL]", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={isModalOpen} onOpenChange={onClose}>
			<DialogContent className="bg-white text-black p-0 overflow-hidden">
				<DialogHeader className="pt-8 px-6">
					<DialogTitle className="text-2xl text-center font-bold">Invite friends</DialogTitle>
					<DialogDescription className="text-center text-zinc-500">
						Share this link to invite people to {server?.name}.
					</DialogDescription>
				</DialogHeader>
				<div className="p-6">
					<Label className="uppercase text-xs font-bold text-zinc-500">
						Server invite link
					</Label>
					<div className="flex items-center mt-2 gap-x-2">
						<Input
							disabled={isLoading}
							className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
							value={inviteUrl}
							readOnly
						/>
						<Button disabled={isLoading} onClick={onCopy} size="icon">
							{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
						</Button>
					</div>
					<Button
						onClick={onNew}
						disabled={isLoading}
						variant="link"
						size="sm"
						className="text-xs text-zinc-500 mt-4"
					>
						Generate a new link
						<RefreshCw className="w-4 h-4 ml-2" />
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
