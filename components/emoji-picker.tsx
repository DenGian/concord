"use client";

import { Smile } from "lucide-react";
import { EmojiPicker as Frimousse } from "frimousse";
import { useTheme } from "next-themes";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface EmojiPickerProps {
	onChange: (value: string) => void;
}

/**
 * Emoji picker for the chat input, built on frimousse (lightweight,
 * React-19-compatible). Opens in a popover above the input.
 */
export const EmojiPicker = ({ onChange }: EmojiPickerProps) => {
	const { resolvedTheme } = useTheme();

	return (
		<Popover>
			<PopoverTrigger>
				<Smile className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition" />
			</PopoverTrigger>
			<PopoverContent
				side="right"
				sideOffset={40}
				className="bg-transparent border-none shadow-none drop-shadow-none mb-16 p-0"
			>
				<Frimousse.Root
					className="isolate flex h-[342px] w-fit flex-col rounded-md border bg-popover text-popover-foreground shadow-md"
					columns={9}
					data-theme={resolvedTheme}
					onEmojiSelect={({ emoji }) => onChange(emoji)}
				>
					<Frimousse.Search className="z-10 mx-2 mt-2 appearance-none rounded-md bg-zinc-100 px-2.5 py-2 text-sm dark:bg-zinc-800" />
					<Frimousse.Viewport className="relative flex-1 outline-hidden">
						<Frimousse.Loading className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
							Loading…
						</Frimousse.Loading>
						<Frimousse.Empty className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
							No emoji found.
						</Frimousse.Empty>
						<Frimousse.List
							className="select-none pb-1.5"
							components={{
								CategoryHeader: ({ category, ...props }) => (
									<div
										className="bg-popover px-3 pt-3 pb-1.5 text-xs font-medium text-muted-foreground"
										{...props}
									>
										{category.label}
									</div>
								),
								Emoji: ({ emoji, ...props }) => (
									<button
										className="flex size-8 items-center justify-center rounded-md text-lg data-[active]:bg-zinc-100 dark:data-[active]:bg-zinc-800"
										{...props}
									>
										{emoji.emoji}
									</button>
								),
							}}
						/>
					</Frimousse.Viewport>
				</Frimousse.Root>
			</PopoverContent>
		</Popover>
	);
};
