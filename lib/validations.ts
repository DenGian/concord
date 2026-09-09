/**
 * Zod schemas shared between client forms (react-hook-form resolvers) and
 * API route handlers, so client and server always validate identically.
 */
import * as z from "zod";

import { ChannelType } from "@/lib/generated/prisma/browser";

const uploadUrlSchema = z
	.string()
	.url({ message: "Upload URL is invalid." })
	.refine((value) => {
		try {
			const { hostname, protocol } = new URL(value);
			return (
				protocol === "https:" &&
				(hostname === "utfs.io" || hostname.endsWith(".ufs.sh"))
			);
		} catch {
			return false;
		}
	}, { message: "Upload URL must come from UploadThing." });

const attachmentTypeSchema = z
	.string()
	.max(100)
	.refine(
		(value) => value === "application/pdf" || value.startsWith("image/"),
		{ message: "Only image and PDF attachments are supported." },
	);

/** Create / edit a server. */
export const serverSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, { message: "Server name is required." })
		.max(100, { message: "Server name must be 100 characters or fewer." }),
	imageUrl: uploadUrlSchema,
});

export type ServerInput = z.infer<typeof serverSchema>;

/** Create / edit a channel. "general" is reserved for the default channel. */
export const channelSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, { message: "Channel name is required." })
		.max(100, { message: "Channel name must be 100 characters or fewer." })
		.refine((name) => name.toLowerCase() !== "general", {
			message: 'Channel name cannot be "general".',
		}),
	type: z.enum(ChannelType),
});

export type ChannelInput = z.infer<typeof channelSchema>;

/** Plain text chat message (channel or direct message). */
export const messageSchema = z.object({
	content: z
		.string()
		.trim()
		.min(1, { message: "Message cannot be empty." })
		.max(2_000, { message: "Message must be 2,000 characters or fewer." }),
});

export type MessageInput = z.infer<typeof messageSchema>;

/** File attachment message. */
export const fileMessageSchema = z.object({
	fileUrl: uploadUrlSchema,
	fileType: attachmentTypeSchema,
});

export type FileMessageInput = z.infer<typeof fileMessageSchema>;

/** API payload accepted by channel and direct-message creation routes. */
export const chatMessageSchema = z
	.object({
		content: z.string().trim().max(2_000).optional(),
		fileUrl: uploadUrlSchema.optional(),
		fileType: attachmentTypeSchema.optional(),
	})
	.superRefine((data, ctx) => {
		if (!data.content && !data.fileUrl) {
			ctx.addIssue({
				code: "custom",
				message: "Message content or attachment is required.",
			});
		}
		if (data.fileUrl && !data.fileType) {
			ctx.addIssue({
				code: "custom",
				path: ["fileType"],
				message: "Attachment type is required.",
			});
		}
		if (!data.fileUrl && data.fileType) {
			ctx.addIssue({
				code: "custom",
				path: ["fileType"],
				message: "Attachment URL is required.",
			});
		}
	});
