"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * TanStack Query client for the whole app — used by the chat for infinite
 * message history (and as the cache that realtime events are written into).
 */
export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
	// useState ensures one client per browser session, never shared between
	// SSR requests.
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						// Chat data is pushed via SSE; avoid surprise refetches.
						refetchOnWindowFocus: false,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};
