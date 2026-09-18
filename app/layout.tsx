import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { ModalProvider } from "@/components/providers/modal-provider";
import { QueryProvider } from "@/components/providers/query-provider";

import "./globals.css";

export const metadata: Metadata = {
	title: {
		default: "Concord",
		template: "%s | Concord",
	},
	description:
		"A real-time community platform with role-based servers, messaging, file sharing and optional audio/video rooms.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="bg-white font-sans dark:bg-[#313338]">
				<ClerkProvider afterSignOutUrl="/">
					<ThemeProvider
						attribute="class"
						defaultTheme="dark"
						enableSystem={false}
						storageKey="concord-theme"
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
