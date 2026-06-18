import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#6C3CF0",
          dark: "#4E2BBF",
          green: "#2FBF71",
          bg: "#F7F8FA",
          text: "#1F2937",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(31, 41, 55, 0.18)",
        card: "0 4px 20px -6px rgba(31, 41, 55, 0.12)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #6C3CF0 0%, #4E2BBF 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
