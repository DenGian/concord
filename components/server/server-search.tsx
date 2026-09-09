"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search } from "lucide-react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ServerSearchProps {
	data: {
		label: string;
		type: "channel" | "member";
		data:
			| {
					icon: React.ReactNode;
					name: string;
					id: string;
			  }[]
			| undefined;
	}[];
}

/**
 * ⌘K / Ctrl+K quick-switcher over the server's channels and members.
 * Selecting a channel navigates to it; selecting a member opens (or starts)
 * the 1:1 conversation.
 */
export const ServerSearch = ({ data }: ServerSearchProps) => {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const router = useRouter();
	const params = useParams();

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return data
			.map((section) => ({
				...section,
				data: (section.data ?? []).filter((item) =>
					item.name.toLowerCase().includes(q),
				),
			}))
			.filter((section) => section.data.length > 0);
	}, [data, query]);

	const onClick = (id: string, type: "channel" | "member") => {
		setOpen(false);
		setQuery("");

		if (type === "member") {
			return router.push(`/servers/${params?.serverId}/conversations/${id}`);
		}
		return router.push(`/servers/${params?.serverId}/channels/${id}`);
	};

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className="group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition"
			>
				<Search className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
				<p className="font-semibold text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition">
					Search
				</p>
				<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-auto">
					<span className="text-xs">⌘</span>K
				</kbd>
			</button>
			<Dialog
				open={open}
				onOpenChange={(value) => {
					setOpen(value);
					if (!value) setQuery("");
				}}
			>
				<DialogContent className="p-0 overflow-hidden top-[20%] translate-y-0">
					<DialogHeader className="sr-only">
						<DialogTitle>Search</DialogTitle>
						<DialogDescription>Search channels and members</DialogDescription>
					</DialogHeader>
					<div className="border-b">
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search all channels and members"
							className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
							autoFocus
						/>
					</div>
					<div className="max-h-[320px] overflow-y-auto px-2 pb-2">
						{filtered.length === 0 && (
							<p className="text-sm text-center text-muted-foreground py-6">
								No results found.
							</p>
						)}
						{filtered.map(({ label, type, data }) => (
							<div key={label} className="mb-2">
								<p className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
									{label}
								</p>
								{data.map(({ id, icon, name }) => (
									<button
										key={id}
										onClick={() => onClick(id, type)}
										className="flex items-center gap-x-2 w-full px-2 py-1.5 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition"
									>
										{icon}
										<span className="truncate">{name}</span>
									</button>
								))}
							</div>
						))}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};
