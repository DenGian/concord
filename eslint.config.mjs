// ESLint flat config (Next.js 16 removed `next lint`; we run `eslint .`).
// eslint-config-next v16 ships native flat configs, no FlatCompat needed.
import { defineConfig, globalIgnores } from "eslint/config";
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

export default defineConfig([
	globalIgnores([
		"node_modules/**",
		".next/**",
		"out/**",
		"build/**",
		// Generated Prisma client — not ours to lint.
		"lib/generated/**",
	]),
	...coreWebVitals,
	...typescript,
]);
