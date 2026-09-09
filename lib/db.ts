import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/lib/generated/prisma/client";

// Re-use a single PrismaClient across hot reloads in development. Next.js
// clears the module cache on every edit, so without this guard each reload
// would open a fresh connection pool and quickly exhaust PostgreSQL.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
	// Prisma 7 connects through a driver adapter instead of its own engine.
	const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

	return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = db;
}
