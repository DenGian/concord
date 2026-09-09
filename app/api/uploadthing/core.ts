import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

/**
 * Uploads are only accepted from signed-in users. This runs on the server
 * for every upload request (the /api/uploadthing route itself is public so
 * UploadThing's callbacks can reach it — see proxy.ts).
 */
const handleAuth = async () => {
	const { userId } = await auth();
	if (!userId) throw new UploadThingError("Unauthorized");
	return { userId };
};

export const ourFileRouter = {
	// Server icon: a single small image.
	serverImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
		.middleware(handleAuth)
		.onUploadComplete(() => {}),
	// Chat attachment: an image or a PDF.
	messageFile: f(["image", "pdf"])
		.middleware(handleAuth)
		.onUploadComplete(() => {}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
