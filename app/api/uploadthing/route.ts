import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "./core";

// UploadThing v7 route handler for the App Router.
export const { GET, POST } = createRouteHandler({
	router: ourFileRouter,
});
