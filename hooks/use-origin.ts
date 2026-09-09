"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * The window origin (e.g. https://myapp.com), empty string while rendering
 * on the server. Implemented with useSyncExternalStore so the value is
 * hydration-safe without a manual "mounted" effect.
 */
export const useOrigin = () => {
	return useSyncExternalStore(
		subscribe,
		() => window.location.origin,
		() => "",
	);
};
