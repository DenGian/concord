"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { messageSchema, type MessageInput } from "@/lib/validations";
import { useModal } from "@/hooks/use-modal-store";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EmojiPicker } from "@/components/emoji-picker";

interface ChatInputProps {
	/** Message endpoint: /api/messages or /api/direct-messages. */
	apiUrl: string;
	/** Query params the endpoint needs (channelId+serverId / conversationId). */
	query: Record<string, string>;
	name: string;
	type: "channel" | "conversation";
}

/**
 * The message composer. Sends text messages, opens the file modal via the
 * "+" button and supports emoji insertion at the end of the draft.
 */
export const ChatInput = ({ apiUrl, query, name, type }: ChatInputProps) => {
	const { onOpen } = useModal();
	const router = useRouter();

	const form = useForm<MessageInput>({
		resolver: zodResolver(messageSchema),
		defaultValues: { content: "" },
	});

	const isLoading = form.formState.isSubmitting;

	const onSubmit = async (values: MessageInput) => {
		try {
			const params = new URLSearchParams(query);
			const res = await fetch(`${apiUrl}?${params.toString()}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values),
			});
			if (!res.ok) {
				throw new Error(`Failed to send message (${res.status})`);
			}

			form.reset();
			router.refresh();
		} catch (error) {
			console.error("[CHAT_INPUT]", error);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name="content"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<div className="relative p-4 pb-6">
									<button
										type="button"
										onClick={() => onOpen("messageFile", { apiUrl, query })}
										className="absolute top-7 left-8 h-[24px] w-[24px] bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600 dark:hover:bg-zinc-300 transition rounded-full p-1 flex items-center justify-center"
										aria-label="Attach a file"
									>
										<Plus className="text-white dark:text-[#313338]" />
									</button>
									<Input
										disabled={isLoading}
										className="px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
										placeholder={`Message ${type === "conversation" ? name : "#" + name}`}
										autoComplete="off"
										{...field}
									/>
									<div className="absolute top-7 right-8">
										<EmojiPicker
											onChange={(emoji) =>
												field.onChange(`${field.value} ${emoji}`)
											}
										/>
									</div>
								</div>
							</FormControl>
						</FormItem>
					)}
				/>
			</form>
		</Form>
	);
};
