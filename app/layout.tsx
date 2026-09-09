import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { ModalProvider } from "@/components/providers/modal-provider";
import { QueryProvider } from "@/components/providers/query-provider";

import "./globals.css";

export const metadata: Metadata = {
	title: {
		default: "Discord Clone",
		template: "%s | Discord Clone",
	},
	description:
		"A full-stack Discord clone: servers, channels, realtime chat, direct messages and audio/video rooms. Built with Next.js, Prisma, Clerk, UploadThing and LiveKit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="bg-white font-sans dark:bg-[#313338]">
				{/* ClerkProvider sits inside <body> as required since Clerk v7. */}
				<ClerkProvider afterSignOutUrl="/">
					<ThemeProvider
						attribute="class"
						defaultTheme="dark"
						enableSystem={false}
						storageKey="discord-theme"
					>
						<QueryProvider>
							<ModalProvider />
							{children}
						</QueryProvider>
					</ThemeProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}
