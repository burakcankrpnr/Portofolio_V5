/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				gece: "#0D0B1F",
				murekkep: "#17142F",
				cizgi: "#2A2650",
				lila: "#C9BEFF",
				kar: "#F3F0FF",
				sis: "#9C97C4",
				kayisi: {
					DEFAULT: "#FFB27A",
					koyu: "#F0955A",
				},
			},
			fontFamily: {
				sans: ['"Instrument Sans"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
				display: ['"Bricolage Grotesque"', '"Instrument Sans"', "system-ui", "sans-serif"],
			},
			maxWidth: {
				shell: "80rem",
			},
			backdropBlur: {
				sm: "4px",
			},
		},
	},
	plugins: [],
}
