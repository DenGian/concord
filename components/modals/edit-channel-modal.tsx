"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { ChannelType } from "@/lib/generated/prisma/browser";
import { channelSchema, type ChannelInput } from "@/lib/validations";
import { useModal } from "@/hooks/use-modal-store";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Modal to rename a channel or change its type. Moderators and admins. */
export const EditChannelModal = () => {
	const { isOpen, onClose, type, data } = useModal();
	const router = useRouter();

	const isModalOpen = isOpen && type === "editChannel";
	const { channel, server } = data;

	const form = useForm<ChannelInput>({
		resolver: zodResolver(channelSchema),
		defaultValues: {
			name: "",
			type: ChannelType.TEXT,
		},
	});

	useEffect(() => {
		if (channel) {
			form.setValue("name", channel.name);
			form.setValue("type", channel.type);
		}
	}, [form, channel]);

	const isLoading = form.formState.isSubmitting;

	const onSubmit = async (values: ChannelInput) => {
		try {
			const query = new URLSearchParams({ serverId: server?.id ?? "" });
			const res = await fetch(`/api/channels/${channel?.id}?${query.toString()}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values),
			});
			if (!res.ok) {
				throw new Error(`Failed to update channel (${res.status})`);
			}

			form.reset();
			router.refresh();
			onClose();
		} catch (error) {
			console.error("[EDIT_CHANNEL_MODAL]", error);
		}
	};

	const handleClose = () => {
		form.reset();
		onClose();
	};

	return (
		<Dialog open={isModalOpen} onOpenChange={handleClose}>
			<DialogContent className="bg-white text-black p-0 overflow-hidden">
				<DialogHeader className="pt-8 px-6">
					<DialogTitle className="text-2xl text-center font-bold">Edit channel</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
						<div className="space-y-8 px-6">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="uppercase text-xs font-bold text-zinc-500">
											channel name
										</FormLabel>
										<FormControl>
											<Input
												disabled={isLoading}
												className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
												placeholder="Enter channel name."
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="uppercase text-xs font-bold text-zinc-500">
											channel type
										</FormLabel>
										<Select
											disabled={isLoading}
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger className="bg-zinc-300/50 border-0 focus:ring-0 text-black ring-offset-0 focus:ring-offset-0 capitalize outline-none">
													<SelectValue placeholder="Select a channel type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{Object.values(ChannelType).map((type) => (
													<SelectItem key={type} value={type} className="capitalize">
														{type.toLowerCase()}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<DialogFooter className="bg-gray-100 px-6 py-4">
							<Button variant="primary" disabled={isLoading}>
								Save
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
