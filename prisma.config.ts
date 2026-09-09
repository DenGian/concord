// Prisma 7 CLI configuration.
//
// Since Prisma 7 the CLI no longer reads the datasource URL from the schema
// file and no longer loads .env automatically — both are handled here.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: env("DATABASE_URL"),
	},
});
