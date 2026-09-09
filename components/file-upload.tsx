"use client";

import { FileIcon, X } from "lucide-react";
import Image from "next/image";

import { UploadDropzone } from "@/lib/uploadthing";

interface FileUploadProps {
	/**
	 * Called with the uploaded file's URL and MIME type, or with no
	 * arguments when the user removes the file again.
	 */
	onChange: (url?: string, type?: string) => void;
	value: string;
	/** Stored alongside the URL because UploadThing URLs have no extension. */
	fileType?: string;
	endpoint: "messageFile" | "serverImage";
}

/**
 * UploadThing dropzone with a preview state: images render as a thumbnail,
 * PDFs as a document chip, both with a remove button.
 */
export const FileUpload = ({ onChange, value, fileType, endpoint }: FileUploadProps) => {
	const isPdf = fileType === "application/pdf";

	if (value && !isPdf) {
		return (
			<div className="relative h-20 w-20">
				<Image fill src={value} alt="Upload" className="rounded-full object-cover" />
				<button
					onClick={() => onChange()}
					className="bg-rose-500 text-white p-1 rounded-full absolute top-0 right-0 shadow-sm"
					type="button"
					aria-label="Remove file"
				>
					<X className="h-4 w-4" />
				</button>
			</div>
		);
	}

	if (value && isPdf) {
		return (
			<div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
				<FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
				<a
					href={value}
					target="_blank"
					rel="noopener noreferrer"
					className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
				>
					PDF attachment
				</a>
				<button
					onClick={() => onChange()}
					className="bg-rose-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm"
					type="button"
					aria-label="Remove file"
				>
					<X className="h-4 w-4" />
				</button>
			</div>
		);
	}

	return (
		<UploadDropzone
			endpoint={endpoint}
			onClientUploadComplete={(res) => {
				onChange(res?.[0]?.ufsUrl, res?.[0]?.type);
			}}
			onUploadError={(error: Error) => {
				console.error("[FILE_UPLOAD]", error);
			}}
		/>
	);
};
