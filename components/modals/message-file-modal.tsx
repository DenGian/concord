"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { fileMessageSchema, type FileMessageInput } from "@/lib/validations";
import { useModal } from "@/hooks/use-modal-store";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";

/**
 * Modal to send an attachment (image or PDF) as a chat message. Opened from
 * the "+" button in the chat input, which provides the target endpoint and
 * query through modal data.
 */
export const MessageFileModal = () => {
	const { isOpen, onClose, type, data } = useModal();
	const router = useRouter();

	const isModalOpen = isOpen && type === "messageFile";
	const { apiUrl, query } = data;

	const form = useForm<FileMessageInput>({
		resolver: zodResolver(fileMessageSchema),
		defaultValues: {
			fileUrl: "",
			fileType: "",
		},
	});

	const isLoading = form.formState.isSubmitting;
	const fileType = useWatch({ control: form.control, name: "fileType" });

	const onSubmit = async (values: FileMessageInput) => {
		try {
			const params = new URLSearchParams(query ?? {});
			const res = await fetch(`${apiUrl}?${params.toString()}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values),
			});
			if (!res.ok) {
				throw new Error(`Failed to send attachment (${res.status})`);
			}

			form.reset();
			router.refresh();
			onClose();
		} catch (error) {
			console.error("[MESSAGE_FILE_MODAL]", error);
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
					<DialogTitle className="text-2xl text-center font-bold">Add an attachment</DialogTitle>
					<DialogDescription className="text-center text-zinc-500">
						Send an image or a PDF as a message.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
						<div className="space-y-8 px-6">
							<div className="flex items-center justify-center text-center">
								<FormField
									control={form.control}
									name="fileUrl"
									render={({ field }) => (
										<FormItem>
											<FormControl>
										<FileUpload
											endpoint="messageFile"
											value={field.value}
											fileType={fileType}
											onChange={(url, fileType) => {
												field.onChange(url ?? "");
												form.setValue("fileType", fileType ?? "");
											}}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>
						<DialogFooter className="bg-gray-100 px-6 py-4">
							<Button variant="primary" disabled={isLoading}>
								Send
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
