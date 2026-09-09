// Tailwind CSS v4 runs entirely as a PostCSS plugin; all design tokens live
// in app/globals.css (no tailwind.config file needed).
const config = {
	plugins: {
		"@tailwindcss/postcss": {},
	},
};

export default config;
