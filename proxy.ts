// Next.js 16 proxy (the successor of middleware.ts).
//
// Every request that matches `config.matcher` below passes through Clerk:
// unauthenticated visitors are redirected to /sign-in, except for the public
// routes listed here.
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
	"/sign-in(.*)",
	"/sign-up(.*)",
	// UploadThing signs its own requests; its webhook callbacks are not Clerk
	// sessions, so the route must stay public (auth happens in the file router
	// middleware instead, see app/api/uploadthing/core.ts).
	"/api/uploadthing(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
	if (!isPublicRoute(req)) {
		await auth.protect();
	}
});

export const config = {
	matcher: [
		// Run on everything except Next.js internals and static assets.
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run on API routes.
		"/(api|trpc)(.*)",
	],
};
